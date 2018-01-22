# Adya Permissions

A permissions manager for Adya's suite of data security tools.

To get started, clone this repository. Then install all dependencies by running:

    $ yarn

To run the application in development mode:

    $ REACT_APP_ADYA_ENV=dev yarn start

To generate an optimized production build, run:

    $ REACT_APP_ADYA_ENV=prod NODE_ENV=production yarn run build

The generated files are located in the `build/` directory.


# REACT_APP_ADYA_ENV

This changes the `env` variable in all the URLs to point to the `prod` or `dev` environment.
