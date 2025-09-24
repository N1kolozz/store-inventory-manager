/**
 * @fileoverview Toast notification component for user feedback.
 * Manages the creation and display of temporary notification messages.
 */

/**
 * Manages toast notifications for user feedback.
 * Creates and displays temporary notification messages.
 * @class
 */
export class ToastManager {
  /**
   * Creates a new ToastManager instance and initializes the toast container.
   * @constructor
   */
  constructor() {
    this.createToastContainer();
  }

  /**
   * Creates the toast container DOM element if it doesn't exist.
   * @private
   */
  createToastContainer() {
    if (!document.getElementById("toastContainer")) {
      const container = document.createElement("div");
      container.id = "toastContainer";
      container.className = "toast-container";
      document.body.appendChild(container);
    }
  }

  /**
   * Shows a toast notification with the specified message and type.
   * @param {string} message - Message to display in the toast
   * @param {string} type - Toast type (success, error, info, warning)
   * @param {number} [duration=3000] - Duration in milliseconds before auto-removal
   */
  show(message, type, duration = 3000) {
    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <div class="toast-content">
        <span class="toast-message">${message}</span>
        <button class="toast-close">&times;</button>
      </div>`;
    const container = document.getElementById("toastContainer");
    container.appendChild(toast);
    setTimeout(() => this.remove(toast), duration);
    toast
      .querySelector(".toast-close")
      .addEventListener("click", () => this.remove(toast));
    requestAnimationFrame(() => toast.classList.add("toast-show"));
  }

  /**
   * Removes a toast notification with fade-out animation.
   * @param {HTMLElement} toast - Toast element to remove
   */
  remove(toast) {
    if (toast && toast.parentNode) {
      toast.classList.add("toast-hide");
      setTimeout(
        () => toast.parentNode && toast.parentNode.removeChild(toast),
        300,
      );
    }
  }

  /**
   * Shows a success toast notification.
   * @param {string} message - Success message to display
   */
  success(message) {
    this.show(message, "success");
  }

  /**
   * Shows an error toast notification with longer duration.
   * @param {string} message - Error message to display
   */
  error(message) {
    this.show(message, "error", 5000);
  }
}
