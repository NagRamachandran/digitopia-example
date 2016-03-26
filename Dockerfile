# install packages
FROM ubuntu
RUN apt-get update
RUN apt-get install -y supervisor
RUN apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -
RUN sudo apt-get install -y nodejs
RUN apt-get install -y git
RUN apt-get install -y imagemagick

# copy app into container
ADD assets /var/app/current/assets
ADD client /var/app/current/client
ADD common /var/app/current/common
ADD docker-assets/webapp /var/app/current/docker-assets/webapp
ADD node_modules /var/app/current/node_modules
ADD server /var/app/current/server
ADD tests /var/app/current/tests
ADD working /var/app/current/working
ADD gruntfile.js /var/app/current/gruntfile.js
ADD package.json /var/app/current/package.json

# set up supervisord
RUN cd /var/app/current; cp docker-assets/webapp/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# install npm (we already copied node_modules in but this updates for OS specific builds if needed)
RUN cd /var/app/current; npm install

VOLUME /var/app/current/client

# expose webapp port
EXPOSE 3000

WORKDIR "/var/app/current"

CMD ["/usr/bin/supervisord"]
