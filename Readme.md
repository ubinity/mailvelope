# Mailvelope

Mailvelope is a browser extension for Google Chrome and Firefox that allows secure email communication based on the OpenPGP standard. It can be configured to work with arbitrary Webmail provider.
This fork is a working copy to add opengpg smart card support.

## OpenPGP backends

Mailvelope uses the following OpenPGP implementations

  - [OpenPGP.js](http://openpgpjs.org/) for the Chrome Extension and for the Firefox Addon. 
    It use the Ubinity fork (https://github.com/ubinity/openpgpjs) that handles openpgp smart card.
  - [WebPCSC] (https://github.com/ubinity/webpcsc-firebreath) a firebreath plugin for accessing PCSC smart card reader inside web browsers

## Status

  - Chrome Extension: _beta_
  - Firefox Addon: untested

## Installation

git clone ... (see "Build instructions")
In chrome go to: chrome://extensions/
Check "Developer mode"
Click load unpaked extension
Select chrome directory at clone root.

For Firefox: untested.

## Build instructions

    git clone git://github.com/ubinity/mailvelope.git 
    cd mailvelope
    git submodule init
    git submodule update
    make build-cs
    make build

## Website

http://www.mailvelope.com
http://openpgpjs.org
https://github.com/ubinity

## Licence

Use of this source code is governed by the GNU AFFERO GENERAL PUBLIC LICENSE that can be found in the LICENSE file.

## About

Mailvelope:
written by Thomas Oberndörfer <toberndo@yarkon.de>  

Openpgp smart card add-on:
Ubinity SAS - Cédric Mesnil <cedric.mesnil@ubinity.com>

Many thanks to OpenPGP.js Team!
