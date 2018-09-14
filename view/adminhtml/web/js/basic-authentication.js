define([
    "jquery",
    "setServiceLabel",
    "popup",
    "resetAllMessages",
    "showErrorMessage",
    "showSuccessMessage",
    "Magento_Ui/js/modal/modal",
    'mage/translate'
], function ($, setServiceLabel, popup, resetAllMessages, showErrorMessage, showSuccessMessage) {
    return function (config, serviceStatus, isAlreadyConfigured) {

        /* Auth button messages */
        let successAuthBtnMsg = $('#fastly-success-auth-button-msg');
        let errorAuthBtnMsg = $('#fastly-error-auth-button-msg');
        let warningAuthBtnMsg = $('#fastly-warning-auth-button-msg');

        /* Auth list messages */
        let successAuthListBtnMsg = $('#fastly-success-auth-list-button-msg');
        let errorAuthListBtnMsg = $('#fastly-error-auth-list-button-msg');
        let warningAuthListBtnMsg = $('#fastly-warning-auth-list-button-msg');

        /* Auth state elements*/
        let authStateSpan = $('#auth_state_span');
        let authStateMsgSpan = $('#fastly_auth_state_message_span');

        let authStatus = true;
        let authDictStatus = null;

        let active_version = serviceStatus.active_version;

        authStateSpan.find('.processing').show();

        /**
         * Basic Authentication VCL snippet upload popup options
         *
         * @type {{title: *, content: (function(): string), actionOk: actionOk}}
         */
        let authenticationOptions = {
            title: jQuery.mage.__(' '),
                content: function () {
                return document.getElementById('fastly-auth-template').textContent;
            },
            actionOk: function () {
                toggleAuth(active_version);
            }
        };

        let authenticationContainerOptions = {
            title: jQuery.mage.__('Create container for authenticated users'),
                content: function () {
                return document.getElementById('fastly-auth-container-template').textContent;
            },
            actionOk: function () {
                createAuth(active_version);
            }
        };

        let authenticationItemsOptions = {
            title: jQuery.mage.__('Basic Auth users'),
                content: function () {
                return document.getElementById('fastly-auth-items-template').textContent;
            },
            actionOk: function () {
            }
        };

        let authenticationContainerDeleteOptions = {
            title: jQuery.mage.__('Delete all authenticated users'),
                content: function () {
                return document.getElementById('fastly-auth-delete-template').textContent;
            },
            actionOk: function () {
                deleteMainAuth(active_version);
            }
        };

        /* Call getBlockingSetting function and display current status */
        getAuthSetting(active_version).done(function (response) {
            authStateSpan.find('.processing').hide();
            let authStateEnabled = authStateMsgSpan.find('#auth_state_enabled');
            let authStateDisabled = authStateMsgSpan.find('#auth_state_disabled');

            if (response.status === true) {
                if (authStateDisabled.is(":hidden")) {
                    authStateEnabled.show();
                }
            } else if (response.status === false) {
                if (authStateEnabled.is(":hidden")) {
                    authStateDisabled.show();
                }
            } else {
                authStateMsgSpan.find('#auth_state_unknown').show();
            }
        }).fail(function () {
            authStateSpan.find('.processing').hide();
            authStateMsgSpan.find('#auth_state_unknown').show();
        });

        // Queries Fastly API to retrieve Basic Auth status
        function getAuthSetting (active_version) {
            return $.ajax({
                type: "POST",
                url: config.checkAuthSettingUrl,
                showLoader: false,
                data: {'active_version': active_version}
            });
        }

        // Queries Fastly API to retrieve ACLs
        function listAuths (active_version) {
            return $.ajax({
                type: "GET",
                url: config.getAuths,
                showLoader: true,
                data: {'active_version': active_version}
            });
        }

        function processAuths(auths) {
            let html = '';
            $.each(auths, function (index, auth) {
                html += '<tr><td>' +
                    '<input name="auth_user" value="'+ auth.item_key +'" data-keyid="'+ auth.item_key_id +'" class="input-text admin__control-text dictionary-items-field" type="text" disabled></td>' +
                    '<td><input name="auth_pass" value="********" class="input-text admin__control-text dictionary-items-field" type="text" disabled></td>' +
                    '<td class="col-actions">' +
                    '<button class="action-delete remove_item_auth"  title="Delete" type="button"><span>Delete</span></button>' +
                    '</td></tr>';
            });
            popup(authenticationItemsOptions);
            $('.upload-button').remove();

            if (html !== '') {
                $('#auth-items-table > tbody').html(html);
            }
        }

        function saveAuthItem(item_key, item_value, loaderVisibility) {
            return $.ajax({
                type: "GET",
                url: config.createAuthItem,
                showLoader: loaderVisibility,
                data: {'active_version': active_version, 'auth_user': item_key, 'auth_pass': item_value},
                beforeSend: function () {
                    resetAllMessages();
                }
            });
        }

        // Delete Auth item
        function deleteAuthItem(item_key_id) {
            return $.ajax({
                type: "GET",
                url: config.deleteAuthItem,
                showLoader: true,
                data: {'active_version': active_version, 'item_key_id': item_key_id},
                beforeSend: function () {
                    resetAllMessages();
                }
            });
        }

        // Toggle Auth process
        function toggleAuth(active_version) {
            let activate_auth_flag = false;

            if ($('#fastly_activate_auth').is(':checked')) {
                activate_auth_flag = true;
            }

            $.ajax({
                type: "POST",
                url: config.toggleAuthSettingUrl,
                data: {
                    'activate_flag': activate_auth_flag,
                    'active_version': active_version
                },
                showLoader: true,
                success: function (response) {
                    if (response.status === true) {

                        modal.modal('closeModal');
                        let disabledOrEnabled = 'disabled';

                        if (authStatus === false) {
                            disabledOrEnabled = 'enabled';
                        } else {
                            disabledOrEnabled = 'disabled';
                        }

                        successAuthBtnMsg.text($.mage.__('Basic Authentication is successfully ' + disabledOrEnabled + '.')).show();

                        if (disabledOrEnabled === 'enabled') {
                            authStateMsgSpan.find('#auth_state_disabled').hide();
                            authStateMsgSpan.find('#auth_state_enabled').show();
                        } else {
                            authStateMsgSpan.find('#auth_state_enabled').hide();
                            authStateMsgSpan.find('#auth_state_disabled').show();
                        }
                    } else {
                        resetAllMessages();
                        showErrorMessage(response.msg);
                    }
                }
            });
        }

        // Delete Authentication dictionary
        function deleteMainAuth() {
            let activate_vcl = false;

            if ($('#fastly_activate_vcl').is(':checked')) {
                activate_vcl = true;
            }

            $.ajax({
                type: "POST",
                url: config.deleteAuth,
                data: {
                    'active_version': active_version,
                    'activate_flag': activate_vcl
                },
                showLoader: true,
                success: function (response) {
                    if (response.status === true) {
                        successAuthBtnMsg.text($.mage.__('Basic Authentication is successfully turned off.')).show();
                        authStateMsgSpan.find('#auth_state_disabled').show();
                        authStateMsgSpan.find('#auth_state_enabled').hide();
                        active_version = response.active_version;
                        authDictStatus = false;
                        modal.modal('closeModal');
                        return successAuthListBtnMsg.text($.mage.__('Authentication users removed.')).show();
                    } else {
                        if (response.not_exists === true) {
                            authDictStatus = false;
                        }
                        resetAllMessages();
                        modal.modal('closeModal');
                        return errorAuthListBtnMsg.text($.mage.__(response.msg)).show();
                    }
                },
                error: function () {
                    authStateMsgSpan.find('#enable_auth_state_unknown').show();
                    return errorAuthListBtnMsg.text($.mage.__('An error occurred while processing your request. Please try again.')).show();
                }
            });
        }

        // CreateAuth
        function createAuth() {
            let activate_vcl = false;

            if ($('#fastly_activate_vcl').is(':checked')) {
                activate_vcl = true;
            }

            $.ajax({
                type: "POST",
                url: config.createAuth,
                data: {
                    'active_version': active_version,
                    'activate_flag': activate_vcl
                },
                showLoader: true,
                success: function (response) {
                    if (response.status === true) {
                        authDictStatus = true;
                        successAuthListBtnMsg.text($.mage.__('Authentication dictionary is successfully created.')).show();
                        active_version = response.active_version;
                        modal.modal('closeModal');
                        processAuths(response.auths);
                    } else if (response.status === 'empty'){
                        processAuths([]);
                    } else {
                        resetAllMessages();
                        showErrorMessage(response.msg);
                    }

                },
                error: function () {
                    return errorAuthListBtnMsg.text($.mage.__('An error occurred while processing your request. Please try again.')).show();
                }
            });
        }

        $('body').on('click', '#add-auth-item', function () {
            $('#auth-items-table > tbody').append('<tr><td><input name="auth_user" required="required" class="input-text admin__control-text dictionary-items-field" type="text"></td>' +
                '<td><input name="auth_pass" required="required" class="input-text admin__control-text dictionary-items-field" type="text"></td>' +
                '<td class="col-actions">' +
                '<button class="action-delete fastly-save-action save_item_auth" title="Save" type="button"><span>Save</span></button>' +
                '</td></tr>');
        });

        $('body').on('click', '.save_item_auth', function () {
            let keyField = $(this).closest('tr').find("input[name='auth_user']");
            let valueField = $(this).closest('tr').find("input[name='auth_pass']");
            let item_key = keyField.val();
            let item_value = valueField.val();
            let errors = false;

            if (item_value === '') {
                errors = true;
                valueField.css('border-color', '#e22626');
            } else {
                valueField.css('border-color', '#878787');
            }

            if (errors) {
                resetAllMessages();
                return showErrorMessage($.mage.__('Please enter all required fields.'));
            }

            let self = this;

            saveAuthItem(item_key, item_value, true).done(function (response) {
                if (response.status === true) {
                    $(self).closest('tr').find("input[name='auth_user']").prop('disabled', true);
                    $(self).closest('tr').find("input[name='auth_user']").data('keyid', btoa(item_key + ':' + item_value));
                    $(self).closest('tr').find("input[name='auth_pass']").prop('disabled', true);
                    $(self).closest('tr').find(".save_item_auth").context.hide();
                    showSuccessMessage($.mage.__('Authentication entry is successfully saved.'));
                } else {
                    showErrorMessage(response.msg);
                }
            }).fail(function () {
                showErrorMessage($.mage.__('An error occurred while processing your request. Please try again.'));
            });
        });

        /**
         * Handles AUTH item removing
         */
        $('body').on('click', '.remove_item_auth', function () {
            let valueField = $(this).closest('tr').find("input[name='auth_user']");
            let self = this;
            let authItemKeyId = valueField.data('keyid');

            if (confirm("Are you sure you want to delete this item?")) {
                deleteAuthItem(authItemKeyId).done(function (response) {
                    if (response.status === true) {
                        $(self).closest('tr').remove();
                        showSuccessMessage($.mage.__('Authentication item is successfully deleted.'));
                    } else if (response.status === 'empty') {
                        showSuccessMessage($.mage.__(response.msg));
                    }
                }).fail(function () {
                    showErrorMessage($.mage.__('An error occurred while processing your request. Please try again.'));
                });
            }
        });

        $('body').on('click', '.remove_auth_dictionary', function () {
            if (isAlreadyConfigured !== true) {
                $(this).attr('disabled', true);
                return alert($.mage.__('Please save config prior to continuing.'));
            }

            resetAllMessages();

            $.when(
                $.ajax({
                    type: "GET",
                    url: config.serviceInfoUrl,
                    showLoader: true
                })
            ).done(function (service) {
                if (service.status === false) {
                    return errorAuthListBtnMsg.text($.mage.__('Please check your Service ID and API token and try again.')).show();
                }

                active_version = service.active_version;
                let next_version = service.next_version;
                let service_name = service.service.name;

                popup(authenticationContainerDeleteOptions);
                setServiceLabel(active_version, next_version, service_name);

            }).fail(function () {
                return errorAuthListBtnMsg.text($.mage.__('An error occurred while processing your request. Please try again.')).show();
            });
        });

        $('#fastly_enable_auth_button').on('click', function () {
            if (isAlreadyConfigured !== true) {
                $(this).attr('disabled', true);
                return alert($.mage.__('Please save config prior to continuing.'));
            }

            resetAllMessages();

            $.ajax({
                type: "GET",
                url: config.serviceInfoUrl,
                showLoader: true
            }).done(function (service) {

                if (service.status === false) {
                    return errorAuthBtnMsg.text($.mage.__('Please check your Service ID and API token and try again.')).show();
                }

                active_version = service.active_version;
                let next_version = service.next_version;
                let service_name = service.service.name;

                getAuthSetting(active_version).done(function (response) {
                    authStatus = response.status;
                }).fail(function () {
                    showErrorMessage($.mage.__('An error occurred while processing your request. Please try again.'))
                });

                // Check if Users are available and Auth can be enabled
                let enableMsg = false;
                $.ajax({
                    type: "GET",
                    url: config.checkAuthUsersAvailable,
                    data: {
                        'active_version': active_version
                    },
                    showLoader: true,
                    success: function (response) {
                        if (response.status === 'empty') {
                            enableMsg = response.msg;
                        }

                        popup(authenticationOptions);
                        setServiceLabel(active_version, next_version, service_name);

                        if (authStatus === false) {
                            $('.modal-title').text($.mage.__('We are about to enable Basic Authentication'));
                        } else {
                            $('.modal-title').text($.mage.__('We are about to disable Basic Authentication'));
                        }

                        if (enableMsg) {
                            let enableAuthPopupMsg =  $('.fastly-message-error');
                            enableAuthPopupMsg.text($.mage.__(response.msg)).show();
                        }
                    }
                });
            }).fail(function () {
                return errorAuthBtnMsg.text($.mage.__('An error occurred while processing your request. Please try again.')).show();
            });
        });

        $('#add-auth-container-button').on('click', function () {

            if (isAlreadyConfigured !== true) {
                $(this).attr('disabled', true);
                return alert($.mage.__('Please save config prior to continuing.'));
            }

            resetAllMessages();

            $.ajax({
                type: "GET",
                url: config.serviceInfoUrl,
                showLoader: true,
                success: function (service) {

                    if (service.status === false) {
                        return errorAuthListBtnMsg.text($.mage.__('Please check your Service ID and API token and try again.')).show();
                    }

                    active_version = service.active_version;
                    let next_version = service.next_version;
                    let service_name = service.service.name;


                    listAuths(active_version, false).done(function (authResp) {
                            if (authResp.status === true) {
                                popup(authenticationItemsOptions);
                                processAuths(authResp.auths);
                            } else if (authResp.status === 'empty') {
                                popup(authenticationItemsOptions);
                                processAuths([]);
                            } else {
                                popup(authenticationContainerOptions);
                            }
                        setServiceLabel(active_version, next_version, service_name);
                    }).fail(function () {
                        return errorAuthListBtnMsg.text($.mage.__('An error occurred while processing your request. Please try again.')).show();
                    });
                },
                fail: function () {
                    return errorAuthListBtnMsg.text($.mage.__('An error occurred while processing your request. Please try again.')).show();
                }
            });
        });
    }
});
