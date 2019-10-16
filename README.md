
# revolut-feed

Experimental feed of transactions from Revolut 

## Setup

1. clone this repo `git clone git@github.com:softwareventures/revolut-feed.git&&cd revolut-feed`

1. install dependencies `yarn install`

1. compile typescript with `tsc`

1. copy example .env file `cp .env.example .env`

1. create ssl keys with the following commands 
    ```sh
    openssl genrsa -out privatekey.pem 1024
    openssl req -new -x509 -key privatekey.pem -out publickey.cer -days 1825
    ```

1. go to `https://business.revolut.com/settings/api` and setup the api app. Copy the contents of the file `publickey.cer` for the `X509 public key` field and enter `http://127.0.0.1` as the redirect uri

1. on the next page, copy the client_id and paste it in the .env file
    > For some reason this only is possible via inspect element-ing the page to copy the html

1. click on the `Enable API access to your account` button and give access to our app. This will redirect you localhost. Copy the access code in the url. It will be in the url param called `code`

1. run the program with `node index.js` and paste the code into the terminal

Now the app is authenticated and will run!


## Arguments

### -v, --version

Outputs the current version.

###  -d, --debug

The debug argument will run the script using the sandbox subdomain. This is used for development and testing.

### -o, --output <name>

This flag specifies the path to the output csv. This can be used to customise the csv filename when generated. This needs to be a valid path on your system. This defaults to `revolut-feed.csv`.

### -f, --from <date>

A date with the format `yyyy/mm/dd` to filter transactions starting from this date.

### -t, --to <date>

A date with the format `yyyy/mm/dd` to filter transactions to this date. This defaults to `now` which will be today's date.


## Known Issues

- There is currently no way to refresh api access after the 90 days is up. If you are not authenticating after 90's days after the initial setup, delete `access_token.json` and repeat the final two steps

- Time needs to be in-sync with internet time or authentication will fail due to the usage of ssl keys to authenticate.


