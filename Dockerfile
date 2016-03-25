# install packages
FROM ubuntu
RUN apt-get update
RUN apt-get install -y supervisor
RUN apt-get install -y nginx
RUN apt-get install -y curl
RUN curl -sL https://deb.nodesource.com/setup_4.x | sudo -E bash -
RUN sudo apt-get install -y nodejs
#RUN apt-get install -y build-essential
RUN apt-get install -y git
RUN apt-get install -y imagemagick

# copy app into container
ADD . /var/app/current

# set up supervisord
RUN cd /var/app/current; cp docker-assets/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# set up nginx
RUN cd /var/app/current; cp docker-assets/nginx.conf /etc/nginx/conf.d/container.conf

# install npm (we already copied node_modules in but this updates for OS specific builds if needed)
RUN cd /var/app/current; npm install

# expose nginx port
EXPOSE 3000 8080

WORKDIR "/var/app/current"

CMD ["/usr/bin/supervisord"]
