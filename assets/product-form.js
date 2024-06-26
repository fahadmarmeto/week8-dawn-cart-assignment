class ProductForm extends HTMLElement {
  constructor() {
    super();

    this.form = this.querySelector('form');
    this.form.querySelector('[name=id]').disabled = false;
    this.form.addEventListener('submit', this.onSubmitHandler.bind(this));
    this.cart = document.querySelector('cart-notification') || document.querySelector('cart-drawer');
    this.submitButton = this.querySelector('[type="submit"]');

    if (document.querySelector('cart-drawer')) this.submitButton.setAttribute('aria-haspopup', 'dialog');

    this.hideErrors = this.dataset.hideErrors === 'true';
  }

  onSubmitHandler(evt) {
    evt.preventDefault();
    if (this.submitButton.getAttribute('aria-disabled') === 'true') return;
  
    this.handleErrorMessage();
  
    this.submitButton.setAttribute('aria-disabled', true);
    this.submitButton.classList.add('loading');
    this.querySelector('.loading__spinner').classList.remove('hidden');
  
    const config = fetchConfig('javascript');
    config.headers['X-Requested-With'] = 'XMLHttpRequest';
    delete config.headers['Content-Type'];
  
    const formData = new FormData(this.form);
    let bundleProductIds = new Set(); // To ensure unique bundles are added
  
    // Collect selected bundle items
    const checkedBundles = document.querySelectorAll('.product-bundle__checkbox:checked');
    checkedBundles.forEach((checkbox) => {
      const productId = checkbox.dataset.productId;
      if (!bundleProductIds.has(productId)) {
        formData.append('items[][id]', productId);
        formData.append('items[][quantity]', 1); // Adjust quantity accordingly
        bundleProductIds.add(productId);
      }
    });
  
    // Add the bundle property if any bundle items exist
    if (bundleProductIds.size > 0) {
      formData.append('properties[_bundle]', 'true');
    }
  
    // Add sections data if required
    if (this.cart) {
      formData.append(
        'sections',
        this.cart.getSectionsToRender().map((section) => section.id)
      );
      formData.append('sections_url', window.location.pathname);
      this.cart.setActiveElement(document.activeElement);
    }
    config.body = formData;
  
    fetch(`${routes.cart_add_url}`, config)
      .then((response) => response.json())
      .then((response) => {
        // Handle response and errors here
        // ...
        this.cart.renderContents(response);
      })
      .catch((e) => {
        console.error(e);
      })
      .finally(() => {
        // Reset form states and controls after submission
        this.submitButton.classList.remove('loading');
        if (this.cart && this.cart.classList.contains('is-empty')) this.cart.classList.remove('is-empty');
        this.querySelector('.loading__spinner').classList.add('hidden');
        this.submitButton.removeAttribute('aria-disabled');
      });
  }

  handleErrorMessage(errorMessage = false) {
    if (this.hideErrors) return;

    this.errorMessageWrapper =
      this.errorMessageWrapper || this.querySelector('.product-form__error-message-wrapper');
    if (!this.errorMessageWrapper) return;
    this.errorMessage = this.errorMessage || this.errorMessageWrapper.querySelector('.product-form__error-message');

    this.errorMessageWrapper.toggleAttribute('hidden', !errorMessage);

    if (errorMessage) {
      this.errorMessage.textContent = errorMessage;
    }
  }
}

if (!customElements.get('product-form')) {
  customElements.define('product-form', ProductForm);
}
