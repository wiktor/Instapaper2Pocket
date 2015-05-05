var GetPocket = require('node-getpocket');
var Promise = require('promise');
var curry = require('curry');
var cheerio = require('cheerio');
var fs = require('fs');
var _ = require('lodash');
var stdio = require('stdio');

var options = stdio.getopt({
    'consumerkey': {
        key: 'c',
        description: 'Pocket consumer key',
        mandatory: true,
        args: 1
    },
    'accesstoken': {
        key: 'a',
        description: 'Pocket access token',
        mandatory: true,
        args: 1
    },
    'instapaperfile': {
        key: 'f',
        description: 'Instapaper export file',
        mandatory: true,
        args: 1
    }
});

var readFile = Promise.denodeify(fs.readFile)

// GetPocket configuration.
var pocket = new GetPocket({"consumer_key": options.consumerkey, "access_token": options.accesstoken});
pocket.sendPromise = Promise.denodeify(pocket.send)

// Returns parsed Instapaper export file. Format: {
//   unread: [ {url: 'link.com', time: XXX(arbitral time just to keep proper order in Pocket)}]
//   starred: ...
//   archived: ...
// }
var parseInstapaperExport = function(fileContent) {
  console.log('Parsing Instapaper file')

  var extractLinks = function(tags, basetime) {
    var time = basetime
    return _.map(tags, function(tag) {
      time--
      return {url: tag.attribs.href, time: time }
    })
  }

  $ = cheerio.load(fileContent)
  return Promise.resolve({
    unread:   extractLinks($($('ol')[0]).find('li a'), Math.floor(new Date().getTime() / 1000)),
    starred:  extractLinks($($('ol')[1]).find('li a'), Math.floor(new Date().getTime() / 1000) - 1000 ),
    archived: extractLinks($($('ol')[2]).find('li a'), Math.floor(new Date().getTime() / 1000) - 2000 )
  })
}

// Adds articles to Pocket. They appear in Queue in order as in Instapaper.
// Returns promise with given list articles with attached item_id from Pocket.
var addArticles = function(articles, type) {
  console.log('Adding ' + type + ' articles to Pocket (' + articles.length + ')')
  var whatToAdd = {
    actions: _.map(articles, function(article) {
      return {
        action: 'add',
        url: article.url,
        time: article.time
      }
    })
  }
  var attachItemIds = function(response) {
    _.each(articles, function(article, index) {
      article.item_id = response.action_results[index].item_id
    })
    return Promise.resolve(articles)
  }
  return pocket.sendPromise(whatToAdd).then(attachItemIds)
}

// Performs Pocket action (favorite, archive etc) on given articles. Returns promise with given articles.
var performAction = function(action, articles) {
  console.log('Invoking action on articles (' + articles.length + '): ' + action)
  var whatToDo = {
    actions: _.map(articles, function(article) {
      return {
        action: action,
        item_id: article.item_id,
        time: article.time
      }
    })
  }
  var returnArticles = function(response) {
    return Promise.resolve(articles)
  }
  return pocket.sendPromise(whatToDo).then(returnArticles)
}

var sendToPocket = function(articles) {
  return Promise.all([
    addArticles(articles.unread, 'unread'),
    addArticles(articles.starred, 'starred').then(curry(performAction)('favorite')).then(curry(performAction)('archive')),
    addArticles(articles.archived, 'archived').then(curry(performAction)('archive'))])
}

// int main(int argc, const char* argv[]) obviously
readFile(options.instapaperfile, 'utf-8')
  .then(parseInstapaperExport)
  .then(sendToPocket)
  .done(function() {
    console.log('Instapaper migrated to Pocket')
  })
