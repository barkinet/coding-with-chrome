/**
 * @fileoverview Turtle output for the Coding with Chrome editor.
 *
 * @license Copyright 2015 The Coding with Chrome Authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 * @author mbordihn@google.com (Markus Bordihn)
 */
goog.provide('cwc.ui.Turtle');

goog.require('cwc.runner.Connector');
goog.require('cwc.soy.Turtle');


/**
 * @param {!cwc.utils.Helper} helper
 * @param {string=} image
 * @constructor
 * @struct
 * @final
 */
cwc.ui.Turtle = function(helper, image = '') {
  /** @type {string} */
  this.name = 'Turtle';

  /** @type {!cwc.utils.Helper} */
  this.helper = helper;

  /** @type {string} */
  this.prefix = this.helper.getPrefix('turtle');

  /** @type {!cwc.runner.Connector} */
  this.connector = new cwc.runner.Connector(helper, 'Turtle Runner Connector');

  /** @type {Element} */
  this.node = null;

  /** @type {Element} */
  this.nodeContent = null;

  /** @type {Object} */
  this.content = null;

  /** @type {!cwc.utils.Logger} */
  this.log = this.helper.getLogger();

  /** @type {string} */
  this.turtleFramework = 'turtle_framework.js';

  /** @type {string} */
  this.jqueryFramework = 'jquery-2.2.4.min.js';

  /** @type {string} */
  this.jqueryTurtleFramework = 'jquery-turtle.js';

  /** @type {boolean} */
  this.ready = false;

  /** @type {string} */
  this.image = image;

  /** @type {Array} */
  this.listener = [];
};


/**
 * Decorates the given node and adds the turtle window.
 * @param {Element} node The target node to add the turtle window.
 */
cwc.ui.Turtle.prototype.decorate = function(node) {
  this.ready = false;
  this.node = node;

  goog.soy.renderElement(
      this.node, cwc.soy.Turtle.template, {'prefix': this.prefix});

  // Runner
  this.connector.init();

  // Event handler
  let layoutInstance = this.helper.getInstance('layout');
  if (layoutInstance) {
    let eventHandler = layoutInstance.getEventHandler();
    this.addEventListener(eventHandler, goog.events.EventType.UNLOAD,
        this.cleanUp, false, this);
  }

  // Content
  this.nodeContent = goog.dom.getElement(this.prefix + 'content');
  this.content = document.createElement('webview');
  this.content.setAttribute('partition', 'turtle');
  this.content.addEventListener('consolemessage',
      this.handleConsoleMessage_.bind(this), false);
  this.content.addEventListener('loadstop',
      this.handleLoadStop_.bind(this), false);
  goog.dom.appendChild(this.nodeContent, this.content);
  this.connector.setTarget(this.content);
  this.content.src = this.renderContent_();
};


/**
 * @param {!string} action
 * @param {Object|number=} optValue
 * @export
 */
cwc.ui.Turtle.prototype.action = function(action, optValue) {
  if (!this.ready) {
    return;
  }
  this.connector.send(action, optValue);
};


/**
 * @export
 */
cwc.ui.Turtle.prototype.reset = function() {
  this.action('__reset__');
};


/**
 * @param {Object=} opt_event
 * @return {string}
 * @private
 */
cwc.ui.Turtle.prototype.renderContent_ = function(opt_event) {
  let renderer = this.helper.getInstance('renderer', true);
  let frameworks = renderer.getFrameworks();
  let helper = renderer.getRendererHelper();

  let css = '';
  let header = helper.getFrameworkHeaders([this.jqueryFramework,
    this.jqueryTurtleFramework, this.turtleFramework], frameworks);
  let body = '';
  if (this.image) {
    body += '<img id="turtle" src="' + this.image + '" ' +
      'style="display: none;">\n';
  }
  body += '\n<script>\n  new cwc.framework.Turtle();\n</script>\n';
  let html = helper.getHTMLGrid(body, header, css);
  return helper.getDataUrl(html);
};


/**
 * Displays the end of the load event.
 * @param {Event=} opt_event
 */
cwc.ui.Turtle.prototype.handleLoadStop_ = function(opt_event) {
  console.log('Turtle graphic loaded ...');
  this.connector.start();
  this.ready = true;
};


/**
 * Collects all messages from the preview window for the console.
 * @param {Event} e
 * @private
 */
cwc.ui.Turtle.prototype.handleConsoleMessage_ = function(e) {
  console.log('Turtle Runner message:', e);
};


/**
 * Adds an event listener for a specific event on a native event
 * target (such as a DOM element) or an object that has implemented
 * {@link goog.events.Listenable}.
 *
 * @param {EventTarget|goog.events.Listenable} src
 * @param {string} type
 * @param {function(?)} listener
 * @param {boolean=} opt_useCapture
 * @param {Object=} opt_listenerScope
 */
cwc.ui.Turtle.prototype.addEventListener = function(src, type,
    listener, opt_useCapture, opt_listenerScope) {
  let eventListener = goog.events.listen(src, type, listener, opt_useCapture,
      opt_listenerScope);
  goog.array.insert(this.listener, eventListener);
};


/**
 * Clears all object based events.
 */
cwc.ui.Turtle.prototype.cleanUp = function() {
  this.listener = this.helper.removeEventListeners(this.listener, this.name);
};
