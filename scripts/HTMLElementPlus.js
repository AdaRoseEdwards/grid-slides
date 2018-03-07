
class HTMLElementPlus extends HTMLElement {

	static defaultAttributeValue() {
		/* the name of the attribute is parsed in as a parameter */
		return;
	}

	static parseAttributeValue(name, value) {
		return value;
	}

	constructor() {
		super();
		this.refs = new Proxy(
			{},
			{
				get: this.__getFromShadowRoot.bind(this)
			}
		);

		// Gets populated by attributeChangedCallback
		this.__attributesMap = {};

		this.__waitingOnAttr = (this.constructor.observedAttributes
			? this.constructor.observedAttributes
			: []
		).filter(name => {
			if (!this.attributes.getNamedItem(name)) {
				this.__attributesMap[name] = this.constructor.defaultAttributeValue(name);
			}
			return !!this.attributes.getNamedItem(name);
		});

		// No attributes so update attribute never called.
		// So fire this anyway.
		if (this.__waitingOnAttr.length === 0) {
			this.allAttributesChangedCallback(this.__attributesMap);
		}
	}

	static get templateHTML() {
		return '';
	}

	get template() {
		if (this.constructor.__templateEl) return document.importNode(this.constructor.__templateEl.content,true);
		this.constructor.__templateEl = document.createElement('template');
		this.constructor.__templateEl.innerHTML = this.constructor.templateHTML;
		if (window.ShadyCSS) window.ShadyCSS.prepareTemplate(this.constructor.__templateEl, this.tagName);
		return document.importNode(this.constructor.__templateEl.content, true);
	}

	__getFromShadowRoot(target, name) {
		return this.shadowRoot.querySelector('[ref="' + name + '"]');
	}

	attributeChangedCallback(attr, oldValue, newValue) {
		this.__attributesMap[attr] = this.constructor.parseAttributeValue.call(this,
			attr,
			newValue
		);

		if (this.__waitingOnAttr.length) {
			const index = this.__waitingOnAttr.indexOf(attr);
			if (index !== -1) {
				// Remove it from array.
				this.__waitingOnAttr.splice(index, 1);
			}
		}

		// All attributes parsed
		if (this.__waitingOnAttr.length === 0) {
			this.allAttributesChangedCallback(this.__attributesMap);
		}
	}

	emitEvent(name, detail) {
		this.dispatchEvent(new CustomEvent(name, { detail, bubbles: true }));
	}

	allAttributesChangedCallback() {}
}