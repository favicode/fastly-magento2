define([
    'jquery',
    'mage/template',
    'Magento_Ui/js/modal/modal'
], function ($, template, modal) {

    return function (config) {

        let ngWafHead = $('#system_full_page_cache_fastly_fastly_next_gen_waf-head');
        let noRulesFoundMessage = $('#ngwaf-no-rules');
        let loader = $('#ngwaf-loading-rules');
        let ruleTableRows = $('#fastly-rules-list');
        let errorMessageDiv = $('#fastly-error-ngwaf-rule');
        let successMessageDiv = $('#fastly-success-ngwaf-rule');
        let ruleModal = $('#fastly-rule-modal-content');
        let newRuleButton = $('#fastly_ngwaf_rule_create_button');

        window.myRuleConfig = config.rulePayload;

        ngWafHead.one('click', function () {
            fetchRules();
        });

        newRuleButton.on('click', function () {
            createRuleModal();
            populateFormOptions();
        })

        function fetchRules() {

            $.ajax({
                type: 'GET',
                url: config.getAllRulesUrl,
                showLoader: false,
                success: function (response) {


                    if ( (response.status ?? false) === false) {

                        let errorMessage = response.msg ?? 'Error while fetching rules';
                        displayError(errorMessage);

                    }  else {

                        errorMessageDiv.hide()

                        let rules = response.rules ?? null;
                        if (!rules || !rules.length) {
                            loader.hide()
                            noRulesFoundMessage.show()
                            return;
                        }

                        renderRuleList(rules);


                    }

                },
                error: function (request, error) {

                    displayError("Something went wrong while fetching rules");
                }
            })
        }

        function displayError(errorMessage) {
            loader.hide()
            errorMessageDiv.show()
            errorMessageDiv.html('')
            errorMessageDiv.html(errorMessage)
        }

        function displaySuccess(successMessage) {
            loader.hide()
            successMessageDiv.show()
            successMessageDiv.html('')
            successMessageDiv.html(successMessage)
        }

        function renderRuleList(rules) {
            loader.hide()

            let html = '';

            $.each(rules, function (index, rule) {
                html += template(
                    `<tr id='fastly_<%- ruleId %>"'>
                            <td>
                                <input data-ruleId="<%- ruleId %>" id='rule_<%- ruleId %>' value="<%- ruleDescription %>" disabled='disabled' class='input-text' type='text'>
                            </td>
                            <td>
                                <input data-ruleId="<%- ruleId %>" id='rule_<%- ruleId %>' value="<%- ruleType %>" disabled='disabled' class='input-text' type='text'>
                            </td>
                            <td class='col-actions'>
                                <button class='action-delete fastly-edit-snippet-icon fastly-edit-rule-action' data-rule-id="<%- ruleId %>" data-rule-description="<%- ruleDescription %>" id='fastly_edit_rule_<%- ruleId %>' title='Edit rule' type='button'/>
                                <span>&nbsp;&nbsp;</span>
                                <button class='action-delete fastly-delete-snippet-icon fastly-delete-rule-action' data-rule-id="<%- ruleId %>" id='fastly_delete_rule_<%- ruleId %>' title='Delete rule' type='button'/>
                            </td>
                         </tr>`,
                    {
                        ruleType: rule.type,
                        ruleDescription: rule.description,
                        ruleId: rule.id,
                    }
                );
            });

            ruleTableRows.html(html);

        }

        $('body').on('click', 'button.fastly-delete-rule-action', function () {

            let ruleId = $(this).data('rule-id');
            let ruleRow = $(this).closest('tr');

            let deleteRuleOptions = {
                type: 'slide',
                responsive: true,
                innerScroll: true,
                title: jQuery.mage.__('You are about to delete a Custom Rule'),
                buttons: [{
                    text: $.mage.__('Cancel'),
                    'class': 'action cancel',
                    click: function () {
                        this.closeModal();
                    }
                }, {
                    text: $.mage.__('Delete'),
                    'class': 'action primary upload-button',
                    click: function () {
                        deleteRule(ruleId, ruleRow);
                    }
                }]
            };

            ruleModal.html('');
            modal(deleteRuleOptions, ruleModal);
            ruleModal.modal('openModal');

        });

        function deleteRule(ruleId, ruleRow) {

            $.ajax({
                type: 'POST',
                url: config.deleteRuleUrl,
                data: {
                    'rule_id': ruleId
                },
                showLoader: true,

                success: function (response) {

                    if ( (response.status ?? false) === false) {
                        let errorMessage = response.msg ?? 'Error while deleting a rule';
                        displayError(errorMessage);
                        successMessageDiv.hide();
                    }  else {
                        errorMessageDiv.hide()
                        ruleRow.remove();
                        displaySuccess('Rule deleted successfully');
                    }

                },
                error: function (request, error) {

                    displayError("Something went wrong while deleting the rule, please try again");
                }
            })

            ruleModal.modal('closeModal');

        }

        $('body').on('click', 'button.fastly-edit-rule-action', function () {

            let ruleId = $(this).data('rule-id');
            let ruleDescription = $(this).data('rule-description');

            createRuleModal(ruleId, ruleDescription)

        });

        function createRuleModal(ruleId = null, ruleDescription = null) {

            let title = ruleId === null ? 'Create Rule' : 'Edit Rule';
            let buttonText = ruleId === null ? 'Create' : 'Update';

            let createRuleOptions = {
                type: 'slide',
                responsive: true,
                innerScroll: true,
                title: jQuery.mage.__(title),
                buttons: [{
                    text: $.mage.__('Cancel'),
                    'class': 'action cancel',
                    click: function () {
                        this.closeModal();
                    }
                }, {
                    text: $.mage.__(buttonText),
                    'class': 'action primary upload-button',
                    click: function () {
                        createRule(ruleId);
                    }
                }]
            };

            ruleModal.html($('#fastly-custom-rule-template').text());
            modal(createRuleOptions, ruleModal);


            if (ruleDescription) {
                $('#custom_rule_description').val(ruleDescription);
            }

            ruleModal.modal('openModal');
        }

        function createRule(ruleId = null) {

            let ruleDescription = $('#custom_rule_description').val();

            $.ajax({
                type: 'POST',
                url: config.editRuleUrl,
                data: {
                    'rule_id': ruleId,
                    'rule_description': ruleDescription
                },
                showLoader: true,

                success: function (response) {

                    if ( (response.status ?? false) === false) {
                        let errorMessage = response.msg ?? 'Error while updating custom rule';
                        displayError(errorMessage);
                        successMessageDiv.hide()
                    }  else {
                        errorMessageDiv.hide()
                        fetchRules()
                        displaySuccess('Custom rule updated')

                    }

                },
                error: function (request, error) {
                    displayError("Something went wrong while updating the rule, please try again");
                }
            })

            ruleModal.modal('closeModal');
        }

        function populateFormOptions() {

            // NGWAF creation/edit rule form
            let ruleTypeSelectElement = $('#fastly_ngwaf_rule_type');
            let ruleConditionField = $('.fastly_ngwaf_rule_condition_field');
            let ruleConditionOperator = $('.fastly_ngwaf_rule_condition_operator');
            let ruleActionsElement = $('#fastly_ngwaf_rule_action_field');
            let rateLimitActionsElement = $('#fastly_ngwaf_rule_rate_limit_action_field');

            let requestRuleLogging = $('.rule-request-logging');
            let ruleActionsSection = $('.fastly-ngwaf-rule-actions');
            let rateLimitActionsSection = $('.fastly-ngwaf-rule-rate-limit-actions');
            let rateLimitDetailsSection = $('.fastly-ngwaf-rule-rate-limit-details');

            ruleTypeSelectElement.on("change", function() {
                let selectedValue = $(this).val();
                let actionsElement;

                if (selectedValue === 'rate_limit') {
                    ruleActionsSection.hide();
                    rateLimitActionsSection.show();
                    rateLimitDetailsSection.show();

                    actionsElement = rateLimitActionsElement;
                } else {
                    ruleActionsSection.show();
                    rateLimitActionsSection.hide();
                    rateLimitDetailsSection.hide();

                    actionsElement = ruleActionsElement;

                }

                if (selectedValue === 'request') {
                    requestRuleLogging.show()
                } else {
                    requestRuleLogging.hide()
                }

                let actionOptions = config.rulePayload?.actions[selectedValue] ?? [];

                actionsElement.empty()
                $.each(actionOptions, function(key, value) {
                    actionsElement.append(
                        $(`<option value='${key}' >${value.name}</option>"`)
                    );
                });

                actionsElement.trigger('change')

            })

            ruleConditionField.on("change", function() {
                let selectedValue = $(this).val();

                let conditionOptions = config.rulePayload?.conditions[selectedValue]?.conditions ?? [];

                ruleConditionOperator.empty()
                $.each(conditionOptions, function(key, value) {
                    ruleConditionOperator.append(
                        $(`<option value='${key}' >${value}</option>"`)
                    );
                });

                let selectOptionValues = config.rulePayload?.conditions[selectedValue]?.select_options ?? [];
                let conditionInputValue = $(this).parents('.ngwaf-condition').find("input[name='fastly_ngwaf_rule_condition_value[]']")
                let conditionInputSelect = $(this).parents('.ngwaf-condition').find("select[name='fastly_ngwaf_rule_condition_value[]']")


                if (!selectOptionValues || !selectOptionValues.length) {
                    conditionInputValue.empty().show()
                    conditionInputSelect.empty().hide()
                } else {
                    conditionInputValue.empty().hide()

                    conditionInputSelect.empty()

                    $.each(selectOptionValues, function(key, value) {
                        conditionInputSelect.append(
                            $(`<option value='${key}' >${value}</option>"`)
                        );
                    });

                    conditionInputSelect.show()

                }


            });

            if (ruleTypeSelectElement && config.rulePayload?.rule_types) {

                ruleTypeSelectElement.empty()
                $.each(config.rulePayload.rule_types, function(key, value) {
                    ruleTypeSelectElement.append(
                        $(`<option value='${key}'>${value}</option>"`)
                    );
                });

                ruleTypeSelectElement.trigger('change')
            }

            if (ruleConditionField && config.rulePayload?.conditions) {
                ruleConditionField.empty()
                $.each(config.rulePayload.conditions, function(key, value) {
                    ruleConditionField.append(
                        $(`<option value='${key}' data-rule-condition-type="${value.type}">${value.name}</option>"`)
                    );
                });

                ruleConditionField.trigger('change')
            }


        }
    }
});
