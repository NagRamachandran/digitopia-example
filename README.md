# Digitopia

This is an example Strongloop app Scaffolding.

The details of this repository are discussed on [digitopia](http://blog.digitopia.com/)

####Installation

To run the app:

1. [Download the repository](https://github.com/mediapolis/digitopia-example/archive/master.zip)

2. unpack it

3. `cd digitopia-example`

4. install [imagemagick](http://www.imagemagick.org/script/binary-releases.php) (if you want to play with file upload example)

4. run `npm install`

5. define localdev.env as described in see [keeping secrets](http://blog.digitopia.com/keeping-secrets/)

	To run app w/o facebook, twitter and s3 api features use these values
	NODE_ENV=localdev
	AUTOUPDATE=true
	SKIP_PASSPORT=true
	SKIP_UPLOAD=true
	SKIP_OG=true
	ADMIN=true

6. run `grunt`

7. run `./localdev.sh node .`

#### to run in docker

1. cd docker-assets; docker-compose up
