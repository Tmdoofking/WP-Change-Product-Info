/**
 * WooCommerce Variation Description Display
 * Handles info icons, hover tooltips, modal popup, and auto-show on first selection.
 */
/* global wpvdSettings, jQuery */
(function ($) {
    'use strict';

    var hoverTimer         = null;
    var isModalOpen        = false;
    var totalAttributes    = 0;
    var selectedAttributes = {};
    var currentVariation   = null;
    var iconClicked        = false;

    var autoShowEnabled = wpvdSettings.autoShow === '1';
    var autoShowFired   = sessionStorage.getItem('wpvd_auto_shown') === '1';

    // ── Auto-show helper ──────────────────────────────────────────────────────
    // Central function: called whenever a variation with a description is found.
    // Guards against double-firing with autoShowFired flag.
    function tryAutoShow(description) {
        if (!autoShowEnabled || autoShowFired || isModalOpen || !description) return;
        autoShowFired = true;
        sessionStorage.setItem('wpvd_auto_shown', '1');
        openModal(description, '', true);
    }

    // ── Icon management ───────────────────────────────────────────────────────

    function initVariationDescriptions() {
        var $form = $('.variations_form');
        if (!$form.length) return;

        var variations = $form.data('product_variations');
        if (!variations) return;

        totalAttributes = $('.variations select').length;

        if (totalAttributes <= 1) {
            addDescriptionIcons(variations);
        } else {
            updateSelectedAttributes();
            updateIconsBasedOnSelection(variations);
        }

        // Bind found_variation directly on the form so it fires even when
        // a theme or plugin calls stopPropagation() before the event reaches document.
        $form.off('found_variation.wpvd').on('found_variation.wpvd', function (event, variation) {
            currentVariation = variation;

            if (totalAttributes > 1) {
                updateIconsBasedOnSelection(variations);
            }

            tryAutoShow(variation.variation_description_raw);
        });

        // Also keep a document-level listener as secondary fallback.
        $(document).off('found_variation.wpvd').on('found_variation.wpvd', function (event, variation) {
            currentVariation = variation;
            tryAutoShow(variation.variation_description_raw);
        });
    }

    function updateSelectedAttributes() {
        selectedAttributes = {};
        var count = 0;
        $('.variations select').each(function () {
            var name  = $(this).attr('name');
            var value = $(this).val();
            if (value && value !== '') {
                selectedAttributes[name] = value;
                count++;
            }
        });
        return count;
    }

    function findMatchingVariation(variations, selectedAttrs) {
        for (var i = 0; i < variations.length; i++) {
            var variation = variations[i];
            var matches   = true;
            for (var attr in selectedAttrs) {
                if (
                    variation.attributes[attr] !== selectedAttrs[attr] &&
                    variation.attributes[attr] !== ''
                ) {
                    matches = false;
                    break;
                }
            }
            if (matches) return variation;
        }
        return null;
    }

    function updateIconsBasedOnSelection(variations) {
        $('.variation-info-icon').remove();

        var selectedCount = updateSelectedAttributes();

        if (selectedCount === totalAttributes) {
            var matched = findMatchingVariation(variations, selectedAttributes);
            if (matched && matched.variation_description_raw) {
                $('.variations tr').each(function () {
                    var $row     = $(this);
                    var attrName = $row.find('select').attr('name');
                    var selVal   = selectedAttributes[attrName];
                    if (!selVal) return;

                    $row.find('.variable-item').each(function () {
                        var $item = $(this);
                        var value = $item.attr('data-value') || $item.find('input').val();
                        if (value === selVal) {
                            addIconToItem($item, matched.variation_description_raw, value);
                            return false;
                        }
                    });
                });
            }
        } else if (selectedCount === totalAttributes - 1) {
            var unselectedAttr = null;
            $('.variations select').each(function () {
                var name = $(this).attr('name');
                if (!selectedAttributes[name]) {
                    unselectedAttr = name;
                    return false;
                }
            });
            if (unselectedAttr) {
                addDescriptionIconsForAttribute(variations, unselectedAttr, selectedAttributes);
            }
        }
    }

    function addDescriptionIconsForAttribute(variations, targetAttr, selectedAttrs) {
        var descMap = {};

        variations.forEach(function (variation) {
            if (!variation.variation_description_raw) return;

            var matchesSelected = true;
            for (var attr in selectedAttrs) {
                if (
                    variation.attributes[attr] !== selectedAttrs[attr] &&
                    variation.attributes[attr] !== ''
                ) {
                    matchesSelected = false;
                    break;
                }
            }

            if (matchesSelected) {
                var targetValue = variation.attributes[targetAttr];
                if (targetValue) descMap[targetValue] = variation.variation_description_raw;
            }
        });

        $('.variations tr').each(function () {
            var $row     = $(this);
            var attrName = $row.find('select').attr('name');
            if (attrName !== targetAttr) return;

            $row.find('.variable-item:not(.radio-variable-item)').each(function () {
                var $item = $(this);
                var value = $item.attr('data-value') || $item.find('input').val();
                if (descMap[value]) addIconToItem($item, descMap[value], value);
            });
        });
    }

    function addDescriptionIcons(variations) {
        var descMap = {};

        variations.forEach(function (variation) {
            if (!variation.variation_description_raw) return;
            Object.keys(variation.attributes).forEach(function (attrKey) {
                var attrValue = variation.attributes[attrKey];
                if (attrValue) {
                    if (!descMap[attrKey]) descMap[attrKey] = {};
                    descMap[attrKey][attrValue] = variation.variation_description_raw;
                }
            });
        });

        $('.variations tr').each(function () {
            var $row     = $(this);
            var attrName = $row.find('select').attr('name');
            if (!attrName) return;

            $row.find('.variable-item:not(.radio-variable-item)').each(function () {
                var $item = $(this);
                var value = $item.attr('data-value') || $item.find('input').val();
                if (descMap[attrName] && descMap[attrName][value]) {
                    addIconToItem($item, descMap[attrName][value], value);
                }
            });
        });
    }

    function addIconToItem($item, description, value) {
        $item.find('.variation-info-icon').remove();

        var iconHtml =
            '<span class="variation-info-icon"' +
            ' data-description="' + encodeURIComponent(description) + '"' +
            ' data-title="' + value + '">' +
            '<svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">' +
            '<circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.5" fill="none"/>' +
            '<text x="8" y="12" text-anchor="middle" fill="currentColor" font-size="10" font-family="Arial">i</text>' +
            '</svg>' +
            '<div class="variation-tooltip-hover"></div>' +
            '</span>';

        if ($item.find('.variable-item-span').length) {
            var $span = $item.find('.variable-item-span');
            $span.html($span.text() + iconHtml);
        } else if ($item.find('label').length) {
            var $label    = $item.find('label');
            var labelText = $label.contents().filter(function () {
                return this.nodeType === 3;
            }).text().trim();

            if (labelText) {
                var $input = $label.find('input').clone();
                $label.html('');
                if ($input.length) $label.append($input);
                $label.append('<span class="label-text">' + labelText + iconHtml + '</span>');
            } else {
                $label.append(iconHtml);
            }
        } else {
            $item.append(iconHtml);
        }
    }

    // ── Modal ─────────────────────────────────────────────────────────────────

    function showModal($icon, isAutoShow) {
        openModal(
            decodeURIComponent($icon.attr('data-description')),
            $icon.attr('data-title'),
            isAutoShow
        );
    }

    function openModal(description, title, isAutoShow) {
        clearTimeout(hoverTimer);
        $('.variation-tooltip-hover').removeClass('show');

        $('#variation-description-modal .wpvd-modal__title').html(
            wpvdSettings.modalTitle + (title ? ': ' + title : '')
        );
        $('#variation-description-modal .wpvd-modal__body').html(description);

        var $hint = $('#wpvd-auto-hint');
        if (isAutoShow) {
            $hint.find('.wpvd-hint__text').text(wpvdSettings.hintText);
            $hint.show();
        } else {
            $hint.hide();
        }

        $('#variation-description-modal').addClass('show');
        $('body').addClass('modal-open');
        isModalOpen = true;
    }

    function closeModal() {
        $('#variation-description-modal').removeClass('show');
        $('body').removeClass('modal-open');
        isModalOpen = false;
    }

    // ── Event bindings ────────────────────────────────────────────────────────

    // Hover tooltip (desktop only)
    $(document).on('mouseenter', '.variation-info-icon', function () {
        if (isModalOpen || ('ontouchstart' in window)) return;

        var $icon       = $(this);
        var description = decodeURIComponent($icon.attr('data-description'));

        clearTimeout(hoverTimer);
        hoverTimer = setTimeout(function () {
            $('.variation-tooltip-hover').removeClass('show');
            var $tooltip = $icon.find('.variation-tooltip-hover');

            var tempDiv     = document.createElement('div');
            tempDiv.innerHTML = description;
            var textContent = (tempDiv.textContent || tempDiv.innerText || '').replace(/\s+/g, ' ').trim();

            if (textContent.length > 80) {
                $tooltip.html('<span style="color:#4CAF50;font-size:12px;font-weight:500;white-space:nowrap;display:inline-block;">✓ 點我查看詳細說明</span>');
                $tooltip.css({ 'white-space': 'nowrap', 'min-width': 'auto', 'max-width': 'none', 'padding': '8px 12px' });
            } else {
                $tooltip.text(textContent);
                $tooltip.css({ 'white-space': 'normal', 'min-width': '180px', 'max-width': '300px' });
            }

            $tooltip.addClass('show');

            setTimeout(function () {
                var rect = $tooltip[0].getBoundingClientRect();
                if (rect.left < 10) {
                    $tooltip.css({ left: '10px', transform: 'translateX(0)' });
                } else if (rect.right > window.innerWidth - 10) {
                    $tooltip.css({ left: 'auto', right: '0', transform: 'translateX(0)' });
                }
            }, 10);
        }, 200);
    });

    $(document).on('mouseleave', '.variation-info-icon', function () {
        clearTimeout(hoverTimer);
        $(this).find('.variation-tooltip-hover').removeClass('show').css({ left: '', right: '', transform: '' });
    });

    // Click / touch to open modal
    $(document).on('mousedown', '.variation-info-icon', function (e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        var $icon = $(this);
        iconClicked = true;
        setTimeout(function () {
            if (iconClicked) showModal($icon, false);
        }, 50);
        return false;
    });

    $(document).on('touchstart', '.variation-info-icon', function (e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        iconClicked = true;
        showModal($(this), false);
        return false;
    });

    $(document).on('click', '.variation-info-icon', function (e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        if (!iconClicked) showModal($(this), false);
        iconClicked = false;
        return false;
    });

    $(document).on('mouseup touchend', '.variation-info-icon', function (e) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        iconClicked = false;
        return false;
    });

    // Close modal
    $(document).on('click touchend', '.wpvd-modal__overlay, .wpvd-modal__close', function (e) {
        e.preventDefault();
        e.stopPropagation();
        closeModal();
        return false;
    });

    $(document).keyup(function (e) {
        if (e.keyCode === 27 && isModalOpen) closeModal();
    });

    // Prevent icon click from propagating to variant item
    $(document).on('click touchstart', '.variable-item', function (e) {
        if ($(e.target).closest('.variation-info-icon').length) {
            e.stopPropagation();
            e.stopImmediatePropagation();
            return false;
        }
    });

    // Re-evaluate icons on select change
    $(document).on('change', '.variations select', function () {
        var $form      = $('.variations_form');
        var variations = $form.data('product_variations');
        if (variations && totalAttributes > 1) {
            setTimeout(function () { updateIconsBasedOnSelection(variations); }, 50);
        }
    });

    // Swatch click: update icons + auto-show fallback via direct product_variations lookup.
    // This covers cases where found_variation is blocked by stopPropagation.
    $(document).on('click', '.variable-item', function () {
        if ($(this).closest('.variation-info-icon').length) return;

        var $form      = $('.variations_form');
        var variations = $form.data('product_variations');
        if (!variations) return;

        // Update icons for multi-attribute products
        if (totalAttributes > 1) {
            setTimeout(function () { updateIconsBasedOnSelection(variations); }, 100);
        }

        // Auto-show fallback: read description directly from product_variations data.
        // Runs 250ms after click to let WooCommerce update the select values first.
        if (autoShowEnabled && !autoShowFired) {
            var $clickedItem = $(this);
            setTimeout(function () {
                if (autoShowFired || isModalOpen) return;

                var clickedValue = $clickedItem.attr('data-value') || $clickedItem.find('input').val();

                // Re-read selections now that WooCommerce has updated the selects
                var attrs = {};
                var count = 0;
                $('.variations select').each(function () {
                    var v = $(this).val();
                    if (v && v !== '') {
                        attrs[$(this).attr('name')] = v;
                        count++;
                    }
                });

                if (count === 0) return;

                // For single-attribute: look up the clicked value directly
                if (totalAttributes <= 1) {
                    for (var i = 0; i < variations.length; i++) {
                        var vAttrs = variations[i].attributes;
                        for (var key in vAttrs) {
                            if ((vAttrs[key] === clickedValue || vAttrs[key] === '') &&
                                variations[i].variation_description_raw) {
                                tryAutoShow(variations[i].variation_description_raw);
                                return;
                            }
                        }
                    }
                } else {
                    // Multi-attribute: look for a fully matched variation
                    var matched = findMatchingVariation(variations, attrs);
                    if (matched) tryAutoShow(matched.variation_description_raw);
                }
            }, 250);
        }
    });

    $(document).on('click', '.reset_variations', function () {
        setTimeout(function () {
            $('.variation-info-icon').remove();
            currentVariation = null;
        }, 100);
    });

    $(document).on('tawcvs_initialized', function () {
        setTimeout(initVariationDescriptions, 100);
    });

    // MutationObserver: keep z-index correct for dynamically added icons
    $(document).ready(function () {
        var target = document.querySelector('.variations_form');
        if (!target) return;

        new MutationObserver(function (mutations) {
            mutations.forEach(function (mutation) {
                $(mutation.addedNodes).find('.variation-info-icon').css('position', 'relative');
            });
        }).observe(target, { childList: true, subtree: true });
    });

    // ── Boot ──────────────────────────────────────────────────────────────────
    setTimeout(initVariationDescriptions, 100);

}(jQuery));
