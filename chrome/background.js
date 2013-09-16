/**
 * Mailvelope - secure email with OpenPGP encryption for Webmail
 * Copyright (C) 2012  Thomas Oberndörfer
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU Affero General Public License version 3
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU Affero General Public License for more details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 */

requirejs.config({
  paths: {
    jquery: 'common/dep/jquery.min',
    scard: 'dep/scard',
    openpgp: 'dep/openpgp',
    mvelo: 'common/ui/inline/mvelo',
    parser_rules: 'common/dep/wysihtml5/js/advanced_parser_rules',
    wysihtml5: 'common/dep/wysihtml5/js/wysihtml5-0.4.0pre'
  },
  shim: {
    'scard':{
        exports: 'scardjs'
    },
    'openpgp': {
        deps: ['jquery','scard'],
        exports: 'openpgp',
        init: function() {
                
          var pluginSC=document.createElement('object')
          pluginSC.setAttribute('id','pcscbridge')
          pluginSC.setAttribute('type',"application/x-pcscbridge")
          pluginSC.setAttribute('width',"0")
          pluginSC.setAttribute('height',"0")
          document.body.insertBefore(pluginSC,document.body.firstChild);

          this.openpgp.init();
          this.openpgp.init_sc();
        }
    },
    'mvelo': {
        exports: 'mvelo'
    },
    'parser_rules': {
        exports: 'wysihtml5ParserRules'
    },
    'wysihtml5': {
        deps: ['parser_rules', 'jquery'],
        exports: 'wysihtml5',
        init: function() {
          var element = $('<textarea/>').appendTo($('body'));
          return new wysihtml5.Editor(element.get(0), {
            parserRules:  wysihtml5ParserRules
          });
        }
    }
  }
});

define(["common/lib/controller", "lib/pgpViewModel", "openpgp", "jquery"], function(controller, model, openpgp, $) {

  // inject content script only once per time slot
  var injectTimeSlot = 600;
  // injection time slot currently open
  var injectOpen = true;
  // optimized cs injection variant, bootstrap code injected that loads cs
  var injectOptimized = true;
  // keep reloaded iframes 
  var frameHosts = [];
  // content script coding as string
  var csCode = '';
  
  function init() {
    controller.extend({initScriptInjection: initScriptInjection});
    migrate();
    initConnectionManager();
    //initContextMenu();
    initScriptInjection();
    initMessageListener();
  }
  
  function initConnectionManager() {
    // store incoming connections by name and id
    chrome.extension.onConnect.addListener(function(port) {
      //console.log('ConnectionManager: onConnect:', port);
      controller.addPort(port);
      port.onMessage.addListener(controller.handlePortMessage);
      // update active ports on disconnect
      port.onDisconnect.addListener(controller.removePort);
    }); 
  }

  function initMessageListener() {
    chrome.extension.onMessage.addListener(
      function(request, sender, sendResponse) {
        switch (request.event) {
          // for content scripts requesting code
          case 'get-cs':
            sendResponse({code: csCode});
            break;
          default:
            controller.handleMessageEvent(request, sender, sendResponse);
        }
      }
    );
  } 

  function initContextMenu() {
    chrome.contextMenus.create({
      "title": "Encrypt",
      "contexts": ["editable"],
      "onclick": onContextMenuEncrypt
    });
  }

  function onContextMenuEncrypt(info) {
    //console.log(info);
    chrome.tabs.getSelected(null, function(tab) {
      chrome.tabs.sendMessage(tab.id, {event: "context-encrypt"});
    });
  }

  function initScriptInjection() {
    
    if (injectOptimized && csCode === '') {
      // load content script
      $.get(chrome.extension.getURL('common/ui/inline/build/cs-mailvelope.js'), function(data) {
        csCode = data;
      });
    }

    var filterURL = controller.getWatchListFilterURLs();

    filterURL = filterURL.map(function(host) {
      return '*://' + host + '/*';
    });
    
    var filterType = ["main_frame", "sub_frame"];

    var requestFilter = {
      urls: filterURL,
      types: filterType
    }
    chrome.webRequest.onCompleted.removeListener(watchListRequestHandler);
    if (filterURL.length !== 0) {
      chrome.webRequest.onCompleted.addListener(watchListRequestHandler, requestFilter);
    }
  }

  function watchListRequestHandler(details) {
    // store frame URL
    frameHosts.push(model.getHost(details.url));
    if (injectOpen || details.type === "main_frame") {
      setTimeout(function() {
        if (frameHosts.length === 0) {
          // no requests since last inject
          return;
        }
        //console.log('cs injected');
        var scriptDetails;
        if (injectOptimized) {
          scriptDetails = {code: csBootstrap(), allFrames: true}
        } else {
          scriptDetails = {file: "common/ui/inline/build/cs-mailvelope.js", allFrames: true}
        }
        chrome.tabs.executeScript(details.tabId, scriptDetails, function() {
          chrome.tabs.insertCSS(details.tabId, {file: "common/ui/inline/framestyles.css", allFrames: true});
          // open injection time slot
          injectOpen = true;
        });
        // reset buffer after injection
        frameHosts.length = 0;
      }, injectTimeSlot);
      // close injection time slot
      injectOpen = false;
    }
  }

  function csBootstrap() {
    return " \
      if (!document.mailvelopeControl) { \
        var hosts = " + JSON.stringify(frameHosts) + "; \
        var match = hosts.some(function(host) { \
          return host === document.location.host; \
        }); \
        if (match) { \
          chrome.extension.sendMessage({event: 'get-cs'}, function(response) { \
            eval(response.code); \
          }); \
        } \
      } \
    ";
  }

  function migrate() {
    // migration
  }
  
  init();

});