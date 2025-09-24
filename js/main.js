/**
 * @fileoverview Main entry point for the vanilla JavaScript SPA application.
 * Initializes the MVC architecture when the DOM is loaded.
 */

import { AppController } from "./AppController.js";

/**
 * Initializes the application when the DOM content is loaded.
 * Creates the main AppController instance and starts the application.
 *
 * @async
 * @function
 * @returns {Promise<void>} Promise that resolves when the application is initialized
 */
document.addEventListener("DOMContentLoaded", async () => {
  const main = new AppController();
  await main.init();
});
