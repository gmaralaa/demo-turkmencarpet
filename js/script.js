(function () {
    'use strict';

    document.documentElement.classList.add('js');

    var MENU_BREAKPOINT = 768;

    function $(selector, scope) {
        return (scope || document).querySelector(selector);
    }

    function $$(selector, scope) {
        return Array.prototype.slice.call((scope || document).querySelectorAll(selector));
    }

    function el(tag, props, kids) {
        var node = document.createElement(tag);
        Object.keys(props || {}).forEach(function (key) {
            if (key === 'text') {
                node.textContent = props[key];
            } else if (key === 'class') {
                node.className = props[key];
            } else {
                node.setAttribute(key, props[key]);
            }
        });
        (kids || []).forEach(function (kid) {
            node.appendChild(kid);
        });
        return node;
    }

    function pageHref(fileName) {
        var link = $('.unlist a[href$="' + fileName + '"]');
        return link ? link.getAttribute('href') : null;
    }

    var lastFocus = null;

    function openOverlay(overlay) {
        lastFocus = document.activeElement;
        overlay.classList.add('open');
        document.body.classList.add('tc-lock');
    }

    function closeOverlay(overlay) {
        overlay.classList.remove('open');
        document.body.classList.remove('tc-lock');
        if (lastFocus && typeof lastFocus.focus === 'function') {
            lastFocus.focus();
        }
    }

    function initOverlayKeys() {
        document.addEventListener('keydown', function (event) {
            var overlay = $('.tc-overlay.open');
            if (!overlay) {
                return;
            }
            if (event.key === 'Escape') {
                closeOverlay(overlay);
                return;
            }
            if (event.key === 'Tab') {
                var items = $$('button, input, textarea, [tabindex="0"]', overlay).filter(function (node) {
                    return !node.disabled;
                });
                if (!items.length) {
                    return;
                }
                var first = items[0];
                var last = items[items.length - 1];
                if (event.shiftKey && document.activeElement === first) {
                    event.preventDefault();
                    last.focus();
                } else if (!event.shiftKey && document.activeElement === last) {
                    event.preventDefault();
                    first.focus();
                }
            }
        });
    }

    function initMenu() {
        var button = $('.formedia');
        var list = $('.unlist');
        if (!button || !list) {
            return;
        }
        list.id = list.id || 'site-menu';
        button.setAttribute('aria-controls', list.id);
        button.setAttribute('aria-expanded', 'false');

        function setOpen(open) {
            list.classList.toggle('open', open);
            button.setAttribute('aria-expanded', open ? 'true' : 'false');
        }

        button.addEventListener('click', function (event) {
            event.stopPropagation();
            setOpen(!list.classList.contains('open'));
        });

        list.addEventListener('click', function (event) {
            if (event.target.closest('a')) {
                setOpen(false);
            }
        });

        document.addEventListener('click', function (event) {
            if (!list.contains(event.target) && !button.contains(event.target)) {
                setOpen(false);
            }
        });

        document.addEventListener('keydown', function (event) {
            if (event.key === 'Escape') {
                setOpen(false);
            }
        });

        window.addEventListener('resize', function () {
            if (window.innerWidth > MENU_BREAKPOINT) {
                setOpen(false);
            }
        });
    }

    function initActiveLink() {
        function clean(name) {
            return name.split('#')[0].split('?')[0].replace(/\.html$/i, '').toLowerCase();
        }
        var current = clean(location.pathname.split('/').pop());
        if (current === '' || current === 'index') {
            current = 'carpet';
        }
        $$('.unlist a').forEach(function (link) {
            if (clean(link.getAttribute('href').split('/').pop()) === current) {
                link.classList.add('active');
                link.setAttribute('aria-current', 'page');
            }
        });
    }

    function initPhoneLinks() {
        var pattern = /\+\d[\d ]{6,}\d/;
        $$('.con-info p, footer .contact .bio p').forEach(function (paragraph) {
            Array.prototype.slice.call(paragraph.childNodes).forEach(function (node) {
                if (node.nodeType !== 3) {
                    return;
                }
                var match = pattern.exec(node.nodeValue);
                if (!match) {
                    return;
                }
                var middle = node.splitText(match.index);
                middle.splitText(match[0].length);
                var link = el('a', {
                    href: 'tel:' + match[0].replace(/[^\d+]/g, ''),
                    'class': 'tc-tel',
                    text: match[0]
                });
                middle.parentNode.replaceChild(link, middle);
            });
        });
    }

    function initNavButtons() {
        var routes = [
            ['.moreProducts', 'Products.html'],
            ['.sign', 'Products.html'],
            ['.container button', 'Blog.html'],
            ['.sec6 button', 'ContactUs.html']
        ];
        routes.forEach(function (route) {
            var href = pageHref(route[1]);
            if (!href) {
                return;
            }
            $$(route[0]).forEach(function (node) {
                node.addEventListener('click', function () {
                    location.href = href;
                });
            });
        });
    }

    function productCaption(image) {
        var product = image.closest('.product');
        if (!product) {
            return '';
        }
        var parts = [];
        ['.p0', '.price, .prod-price', '.dets p, .prod-dets p'].forEach(function (selector) {
            $$(selector, product).forEach(function (node) {
                var text = node.textContent.replace(/\s+/g, ' ').trim();
                if (text) {
                    parts.push(text);
                }
            });
        });
        return parts.join(' \u00B7 ');
    }

    function initLightbox() {
        var images = $$('.product .imgg');
        if (!images.length) {
            return;
        }
        var big = el('img');
        var caption = el('figcaption');
        var close = el('button', { type: 'button', 'class': 'tc-close', 'aria-label': 'Close', text: '\u00D7' });
        var figure = el('figure', { 'class': 'tc-figure' }, [big, caption]);
        var overlay = el('div', {
            'class': 'tc-overlay tc-lightbox',
            role: 'dialog',
            'aria-modal': 'true',
            'aria-label': 'Product photo'
        }, [close, figure]);
        document.body.appendChild(overlay);

        overlay.addEventListener('click', function (event) {
            if (event.target === overlay || event.target === close) {
                closeOverlay(overlay);
            }
        });

        images.forEach(function (image) {
            image.tabIndex = 0;
            image.setAttribute('role', 'button');
            image.setAttribute('aria-label', 'Enlarge photo');

            function show() {
                big.src = image.currentSrc || image.src;
                big.alt = image.getAttribute('alt') || 'Carpet photo';
                caption.textContent = productCaption(image);
                openOverlay(overlay);
                close.focus();
            }

            image.addEventListener('click', show);
            image.addEventListener('keydown', function (event) {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    show();
                }
            });
        });
    }

    function initAccordion() {
        var rows = $$('.section-3 .push');
        var items = [];

        rows.forEach(function (row, index) {
            var title = $('p', row);
            var text = $('.push-text', row);
            if (!title || !text) {
                return;
            }
            text.id = text.id || 'push-text-' + (index + 1);
            title.setAttribute('role', 'button');
            title.setAttribute('tabindex', '0');
            title.setAttribute('aria-expanded', 'false');
            title.setAttribute('aria-controls', text.id);

            items.push({
                row: row,
                setOpen: function (open) {
                    row.classList.toggle('open', open);
                    title.setAttribute('aria-expanded', open ? 'true' : 'false');
                }
            });

            row.addEventListener('click', function (event) {
                if (text.contains(event.target)) {
                    return;
                }
                var willOpen = !row.classList.contains('open');
                items.forEach(function (item) {
                    item.setOpen(item.row === row ? willOpen : false);
                });
            });

            title.addEventListener('keydown', function (event) {
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    row.click();
                }
            });
        });
    }

    function initFooterLinks() {
        $$('footer a[href="#"]').forEach(function (link) {
            link.addEventListener('click', function (event) {
                event.preventDefault();
            });
        });
    }

    function initReveal() {
        if (!('IntersectionObserver' in window)) {
            return;
        }
        if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }
        var selector = [
            '.section-1', '.section-2', '#section-2', '.section-3 .push', '.section-4',
            '.position', '.section-6', '.section-7', '.prod-img .product', '.blog-sec',
            '.con-sec-1', '.con-sec-2', '.res-p', '.prod-sec h1'
        ].join(',');
        var limit = window.innerHeight * 0.9;
        var targets = $$(selector).filter(function (node) {
            return node.getBoundingClientRect().top > limit;
        });

        try {
            var observer = new IntersectionObserver(function (entries) {
                entries.forEach(function (entry) {
                    if (entry.isIntersecting) {
                        entry.target.classList.add('in');
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.08, rootMargin: '0px 0px -4% 0px' });

            targets.forEach(function (node, index) {
                node.classList.add('reveal');
                node.style.transitionDelay = (index % 3) * 70 + 'ms';
                observer.observe(node);
            });
        } catch (err) {
            targets.forEach(function (node) {
                node.classList.remove('reveal');
            });
        }
    }

    document.addEventListener('DOMContentLoaded', function () {
        [
            initOverlayKeys,
            initMenu,
            initActiveLink,
            initPhoneLinks,
            initNavButtons,
            initLightbox,
            initAccordion,
            initFooterLinks,
            initReveal
        ].forEach(function (start) {
            try {
                start();
            } catch (err) {
                if (window.console) {
                    console.error(start.name, err);
                }
            }
        });
    });
})();
