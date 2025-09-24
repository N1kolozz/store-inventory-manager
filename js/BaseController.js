/**
 * @fileoverview Base controller class providing common functionality for all controllers.
 * Implements the observer pattern for model subscriptions and cleanup.
 */

/**
 * Base controller class providing common functionality for all controllers.
 * Implements the observer pattern for model subscriptions and cleanup.
 * @class
 */
export class BaseController {
  /**
   * Creates a new BaseController instance.
   * @constructor
   */
  constructor() {
    this.subscriptions = [];
  }

  /**
   * Subscribes to model changes and tracks the subscription for cleanup.
   * @param {BaseModel} model - Model to subscribe to
   * @param {Function} handler - Handler function for model changes
   * @returns {void}
   */
  subscribe(model, handler) {
    const unsub = model.subscribe(handler);
    this.subscriptions.push(unsub);
  }
}
