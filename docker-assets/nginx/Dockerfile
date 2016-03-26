# install packages
FROM ubuntu
RUN apt-get update
RUN apt-get install -y supervisor
RUN apt-get install -y nginx

# set up supervisord
ADD supervisord.conf /etc/supervisor/conf.d/supervisord.conf

# set up nginx
ADD nginx.conf /etc/nginx/conf.d/container.conf

# expose nginx port
EXPOSE 8080

WORKDIR "/var/app/current"

CMD ["/usr/bin/supervisord"]
