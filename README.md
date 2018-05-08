# adyaapp
Adya app v2

1. Tools setup - 
* Install Git on your mac
* Install VS Code on your mac

2. Rep setup
* Create working folder
Documents>Adya>Git
* Clone git repo using following command
git clone https://github.com/adyascm/adyaapp.git

3. Packages and Virtual Env setup
* Install Homebrew for installing Node and NPM
ruby -e "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/master/install)"

* Install Node and NPM
brew install node

* Install React dependencies
>Go to reactv2 folder in the repo folder
npm install

* Install Pip
sudo easy_install pip

* Install VirtualEnv
pip install virtualenv

* Install Python packages
>Go to apiv2 folder
virtualenv lib
source lib/bin/activate
pip install -r requirements.txt
Copy client_secrets.json in the apiv2>adya>google folder


*Change MySQL password
>Goto cd /usr/local/mysql/bin/
Stop MySQL server
Run following commands
sudo mysqld_safe --skip-grant-tables;
mysql -u root
USE mysql;
UPDATE mysql.user SET authentication_string=PASSWORD("your-password") WHERE User='root';
FLUSH PRIVILEGES;
\q
Restart MySQL Server

