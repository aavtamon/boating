#!/bin/sh

DATABASE='boating'
DBUSER='boatserver'
DBPASSWORD='test-password'

mysql -uroot -e "CREATE USER '${DBUSER}'@'localhost' IDENTIFIED BY '${DBPASSWORD}';"
mysql -uroot -e "CREATE DATABASE ${DATABASE};"
mysql -uroot -e "GRANT ALL ON ${DATABASE}.* TO '${DBUSER}'@'localhost';"



