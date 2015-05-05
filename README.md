# Instapaper2Pocket
Handy script to migrate your Instapaper account to Pocket.

Unfortunately [Pocket's import from Instapaper](https://getpocket.com/import/instapaper/) is flawed in many ways. This script does proper job:
 - Instapaper's all starred articles are added as favorites and archived in Pocket.
 - All unread articles are added as unread in Pocket.
 - All archived articles are added as archived in Pocket obviously.
 - Order of articles in Pocket will be the same as in Instapaper.
 
Also this script makes fun use of promises and currying. Good learning.

## Usage

1. [Obtain consumer key](http://getpocket.com/developer/apps/new) to access Pocket API. Make sure to give it all permissions (add, modify, retrieve) and select `Desktop (other)` as platform.
2. Generate your access token:
  - Run `node node_modules/node-getpocket/authorise.js -c YOUR_CONSUMER_KEY`
  - Go to [http://localhost:8080/](http://localhost:8080/) and authorize your consumer key to access your account.
  - After successful authorization you will see your access token. It will look like this:

    ```javascript
    var config = { "consumer_key": "YOUR_CONSUMER_KEY", "access_token": "YOUR_ACCESS_TOKEN" };
    ```
3. Export your articles from [Instapaper's settings page](https://www.instapaper.com/user). It will be named `instapaper-export.html`.
4. Run the script

  ```
  node instapaper2pocket.js -f instapaper-export.html -c YOUR_CONSUMER_KEY -a YOUR_ACCESS_TOKEN
  ```
5. Voilà
