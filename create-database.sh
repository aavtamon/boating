#!/bin/sh

DATABASE='boating'
DBUSER='boatserver'
DBPASSWORD='test-password'


echo "Creating database ${DATABASE} for the user ${DBUSER} with password ${DBPASSWORD}"

mysql -uroot -e "CREATE USER '${DBUSER}'@'localhost' IDENTIFIED BY '${DBPASSWORD}';"
mysql -uroot -e "CREATE DATABASE ${DATABASE};"
mysql -uroot -e "GRANT ALL ON ${DATABASE}.* TO '${DBUSER}'@'localhost';"

echo "All done!"
