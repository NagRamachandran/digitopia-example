# Digitopia

This is an example Strongloop app Scaffolding

The details of this configuration are discussed on [digitopia](http://blog.digitopia.com/)

####Installation

git clone https://github.com/mediapolis/digitopia-example.git

cd to the directory

npm install

to run the app:

AWS_S3_KEY="YOUR KEY" AWS_S3_KEY_ID="YOUR ID" S3_BUCKET="YOUR BUCKET" node .

to run the tests (app needs to be running):

AWS_S3_KEY="YOUR KEY" AWS_S3_KEY_ID="YOUR ID" S3_BUCKET="YOUR BUCKET" mocha tests/upload.js
