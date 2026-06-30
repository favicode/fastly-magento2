define([
    'jquery',
    'mage/template',
    'Magento_Ui/js/modal/modal'
], function ($, template, modal) {

    return function (config) {

        const NUMBER_OF_CONDITIONS_LIMIT = 10;
        const NUMBER_OF_ACTIONS_LIMIT = 2

        let ngWafHead = $('#system_full_page_cache_fastly_fastly_next_gen_waf-head');
        let noRulesFoundMessage = $('#ngwaf-no-rules');
        let loader = $('#ngwaf-loading-rules');
        let ruleTableRows = $('#fastly-rules-list');
        let errorMessageDiv = $('#fastly-error-ngwaf-rule');
        let successMessageDiv = $('#fastly-success-ngwaf-rule');
        let ruleModal = $('#fastly-rule-modal-content');
        let newRuleButton = $('#fastly_ngwaf_rule_create_button');
        let workspaceIdElement = $('#system_full_page_cache_fastly_fastly_next_gen_waf_fastly_next_gen_waf_workspace_id');


        let selectOptions = undefined;

        ngWafHead.one('click', function () {
            fetchRules();
        });

        // One token can be related to multiple Workspace IDs - fetch Rules for specific ID on change
        workspaceIdElement.on('change', function () {
            fetchRules()
        })

        newRuleButton.on('click', function () {
            populateSelectFieldOptions();
            createRuleModal();
        })

        function fetchRules() {

            $.ajax({
                type: 'GET',
                url: config.getAllRulesUrl,
                data: {
                    'workspace_id': workspaceIdElement.val()
                },
                showLoader: false,
                success: function (response) {


                    if ( (response.status ?? false) === false) {

                        let errorMessage = response.msg ?? 'Error while fetching rules';
                        displayError(errorMessage);

                    }  else {

                        errorMessageDiv.hide()
                        noRulesFoundMessage.hide()

                        let rules = response.rules ?? null;
                        if (!rules || !rules.length) {
                            rules = [];
                            loader.hide()
                            noRulesFoundMessage.show()
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
            errorMessageDiv.text('')
            errorMessageDiv.text(errorMessage)
        }

        function displaySuccess(successMessage) {
            loader.hide()
            successMessageDiv.show()
            successMessageDiv.text('')
            successMessageDiv.text(successMessage)
        }

        function renderRuleList(rules) {
            loader.hide()

            let html = '';

            $.each(rules, function (index, rule) {
                html += template(
                    `<tr id='fastly_<%- ruleId %>'>
                            <td>
                                <input data-ruleId="<%- ruleId %>" id='rule_<%- ruleId %>' value="<%- ruleDescription %>" disabled='disabled' class='input-text' type='text'>
                            </td>
                            <td>
                                <input data-ruleId="<%- ruleId %>" id='rule_<%- ruleId %>' value="<%- ruleType %>" disabled='disabled' class='input-text' type='text'>
                            </td>
                            <td class='col-actions'>
                                <button class='action-delete fastly-edit-snippet-icon fastly-edit-rule-action'
                                data-rule-id="<%- ruleId %>"
                                data-rule-description="<%- ruleDescription %>"
                                data-rule-type="<%- ruleType %>"
                                data-rule-enabled="<%- ruleEnabled %>"
                                data-rule-group-operator="<%- ruleGroupOperator %>"
                                data-rule-conditions="<%- ruleConditions %>"
                                data-rule-actions="<%- ruleActions %>"
                                data-rule-rate-limit="<%- ruleRateLimit %>"
                                data-rule-request-logging="<%- ruleRequestLogging %>"
                                id='fastly_edit_rule_<%- ruleId %>' title='Edit rule' type='button'/>
                                <span>&nbsp;&nbsp;</span>
                                <button class='action-delete fastly-delete-snippet-icon fastly-delete-rule-action' data-rule-id="<%- ruleId %>" id='fastly_delete_rule_<%- ruleId %>' title='Delete rule' type='button'/>
                            </td>
                         </tr>`,
                    {
                        ruleType: rule.type,
                        ruleDescription: rule.description,
                        ruleId: rule.id,
                        ruleEnabled: rule.enabled,
                        ruleGroupOperator: rule.group_operator,
                        ruleConditions: JSON.stringify(rule.conditions),
                        ruleActions: JSON.stringify(rule.actions),
                        ruleRateLimit: JSON.stringify(rule.rate_limit),
                        ruleRequestLogging: rule.request_logging,
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
                    'rule_id': ruleId,
                    'workspace_id': workspaceIdElement.val()
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

            let ruleParameters = {
                'id': $(this).data('rule-id'),
                'description': $(this).data('rule-description'),
                'type': $(this).data('rule-type'),
                'enabled': $(this).data('rule-enabled'),
                'group_operator': $(this).data('rule-group-operator'),
                'conditions': $(this).data('rule-conditions'),
                'actions': $(this).data('rule-actions'),
                'rate_limit': $(this).data('rule-rate-limit'),
                'request_logging': $(this).data('rule-request-logging'),
            };

            populateSelectFieldOptions();
            createRuleModal(ruleId, ruleParameters);

        });

        function createRuleModal(ruleId = null, ruleParameters = null) {

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
                        createRule();
                    }
                }]
            };

            ruleModal.html($('#fastly-custom-rule-template').text());
            modal(createRuleOptions, ruleModal);

            populateFormOptions();

            if (ruleId) {
                $('#fastly_ngwaf_rule_id').val(ruleId)
            }

            if (ruleParameters?.description) {
                $('#fastly_ngwaf_rule_description').val(ruleParameters.description);
            }

            // Type can't be edited/changed on existing rule
            if (ruleParameters?.type) {
                $('#fastly_ngwaf_rule_type').val(ruleParameters.type);
                $('#fastly_ngwaf_rule_type').prop("disabled", true);
            }

            if (ruleParameters?.hasOwnProperty('enabled')) {
                $('#fastly_ngwaf_rule_enabled').val(ruleParameters.enabled.toString());
            }

            if (ruleParameters?.request_logging) {
                $('#fastly_ngwaf_rule_request_logging').val(ruleParameters.request_logging);
            }

            if (ruleParameters?.group_operator) {
                $('#fastly_ngwaf_rule_condition_match_operator').val(ruleParameters.group_operator);
            }

            let actionType = undefined;

            // If rate limit is object, rule is rate limit and it has rate limit info
            if (ruleParameters?.rate_limit && typeof ruleParameters.rate_limit === 'object') {

                $('.fastly-ngwaf-rule-actions').hide()
                $('.fastly-ngwaf-rule-rate-limit-actions').show()
                $('.fastly-ngwaf-rule-rate-limit-details').show()

                actionType = $('#fastly_ngwaf_rule_rate_limit_action_field')

                if (ruleParameters.rate_limit?.duration) {
                    $('#fastly_ngwaf_rule_rate_limit_duration').val(ruleParameters.rate_limit.duration);
                }

                if (ruleParameters.rate_limit?.interval) {
                    $('#fastly_ngwaf_rule_rate_limit_interval').val(ruleParameters.rate_limit.interval);

                }

                if (ruleParameters.rate_limit?.threshold) {
                    $('#fastly_ngwaf_rule_rate_limit_threshold').val(ruleParameters.rate_limit.threshold);
                }

                if (ruleParameters.rate_limit?.signal) {
                    $('#fastly_ngwaf_rule_rate_limit_threshold_signal').val(ruleParameters.rate_limit.signal);

                }

                if (ruleParameters.rate_limit?.client_identifiers && Array.isArray(ruleParameters.rate_limit.client_identifiers)) {

                    let clientIdentifier = ruleParameters.rate_limit.client_identifiers[0];

                    if (clientIdentifier?.type) {
                        $('#fastly_ngwaf_rule_rate_limit_client_identifier').val(clientIdentifier.type);

                        // IP identifier doesn't have input value, its just IP
                        if (clientIdentifier.type !== 'ip') {
                            $('.fastly-ngwaf-rule-rate-limit-client-identifier-value').show()
                        }

                        // Signal property is displayed in select element, other options have "name" as input value
                        if (clientIdentifier.signal) {
                            $("select[name='fastly_ngwaf_rule_rate_limit_client_identifier_select_value']").val(clientIdentifier.signal);
                            $("input[name='fastly_ngwaf_rule_rate_limit_client_identifier_input_value']").hide()
                        } else if (clientIdentifier.name) {
                            $("input[name='fastly_ngwaf_rule_rate_limit_client_identifier_input_value']").val(clientIdentifier.name);
                            $("select[name='fastly_ngwaf_rule_rate_limit_client_identifier_select_value']").hide()

                        }
                    }
                }

            } else if (ruleParameters?.rate_limit && typeof ruleParameters.rate_limit === 'string') {

                // String value is returned when rule is not Rate Limit type, usually empty value
                actionType = $('.fastly_ngwaf_rule_action_field')

                $('.fastly-ngwaf-rule-actions').show()
                $('.fastly-ngwaf-rule-rate-limit-actions').hide()
                $('.fastly-ngwaf-rule-rate-limit-details').hide()
            }

            let actionsExists = ruleParameters?.actions && Array.isArray(ruleParameters.actions) && actionType;

            // type "request" is the only one with multiple action options - others don't have to be iterated through
            if (actionsExists && ruleParameters?.type !== 'request') {

                // Use first element, there are no others in these actions
                let action = ruleParameters.actions[0];

                actionType.empty()
                $.each(config.rulePayload?.actions[ruleParameters?.type] ?? [], function(key, value) {
                    actionType.append(
                        $('<option>', { value: key, text: value.name })
                    );
                });

                actionType.val(action.type);

                if (action.signal) {

                    let optionsForAction = [];
                    let ruleActionsValueElement = undefined;
                    let ruleActionsBlock = undefined;
                    let rateLimitMatchType = undefined;

                    // Rate limit has different block and elements, doesn't use the same as request and exclude signal
                    if (ruleParameters?.type === 'rate_limit') {

                        ruleActionsValueElement = $('#fastly_ngwaf_rule_rate_limit_action_other_signal_type');
                        rateLimitMatchType = $('#fastly_ngwaf_rule_rate_limit_action_match_type');
                        optionsForAction = config.rulePayload?.actions[ruleParameters?.type]?.[action.type]?.options ?? [];

                        // Different combinations based on received responses in testing
                        if (action.signal === 'ALL-REQUESTS') {
                            rateLimitMatchType.val(action.signal)

                        } else if (action.signal !== ruleParameters.rate_limit?.signal) {
                            rateLimitMatchType.val('OTHER-SIGNAL')
                            $('.rate-limit-action-value-option').show()
                        }


                    } else {
                        ruleActionsValueElement = $('.fastly_ngwaf_rule_action_value');
                        ruleActionsBlock = $('.fastly_ngwaf_rule_action_value_block');
                        optionsForAction = config.rulePayload?.actions[ruleParameters?.type]?.[action.type]?.options ?? [];

                    }

                    // String is used for options which are loaded dynamically
                    if (typeof optionsForAction === 'string') {
                        optionsForAction = selectOptions?.[optionsForAction] ?? [];
                    }

                    ruleActionsValueElement.empty()

                    $.each(optionsForAction, function(key, value) {

                        ruleActionsValueElement.append(
                            $('<option>', { value: value.id, text: value.display_name })
                        );
                    });

                    if (ruleActionsBlock) {
                        ruleActionsBlock.show()
                    }

                    ruleActionsValueElement.show()
                    ruleActionsValueElement.val(action.signal);
                }

                displayAddActionButton($('#ngwaf-add-rule-action-button'), ruleParameters.type)

            } else if (actionsExists && ruleParameters?.type === 'request') {

                // Request is the only type which can have multiple actions

                let actionsElement = $('.fastly-ngwaf-rule-actions');
                actionsElement.children('.fastly-ngwaf-rule-action').remove();
                let currentElement;

                $.each(ruleParameters.actions, function(index, action) {

                    addActionField(ruleParameters.type)

                    currentElement = actionsElement.children('.fastly-ngwaf-rule-action').last()
                    currentElement.find('.fastly_ngwaf_rule_action_field').val(action.type).trigger('change');

                    if (action.signal) {
                        currentElement.find('.fastly_ngwaf_rule_action_value').val(action.signal);
                    } else if (action.deception_type) {
                        currentElement.find('.fastly_ngwaf_rule_action_value').val(action.deception_type);
                    } else if (action.hasOwnProperty('allow_interactive')) {
                        currentElement.find('.fastly_ngwaf_rule_action_value').val(action.allow_interactive.toString());
                    }
                })

                displayAddActionButton($('#ngwaf-add-rule-action-button'), ruleParameters.type)
            }

            if (ruleParameters?.conditions && Array.isArray(ruleParameters.conditions)) {

                let conditionsElement = $('.ngwaf-conditions');
                conditionsElement.children(".ngwaf-condition").remove()
                let previousElement;
                let currentElement;
                let currentGroupElement;
                let additionType = '';
                let isFirstElement = false
                let conditionMultivalOptions;

                $.each(ruleParameters.conditions, function(index, condition) {

                    if (condition.type === 'single') {

                        if (conditionsElement.children('.ngwaf-condition, .ngwaf-condition-group').last().length) {
                            previousElement = conditionsElement.children('.ngwaf-condition, .ngwaf-condition-group').last()
                            additionType = 'after';

                        } else {
                            previousElement = conditionsElement;
                            additionType = '';
                        }

                        // Use existing method for addition, trigger event to ensure proper populate/display of elements
                        addSingleCondition(previousElement, additionType)
                        currentElement = conditionsElement.children('.ngwaf-condition').last()

                        currentElement.find('.fastly_ngwaf_rule_condition_field')
                            .val(condition.field).trigger('change');
                        currentElement.find('.fastly_ngwaf_rule_condition_operator')
                            .val(condition.operator).trigger('change');
                        currentElement.find('.fastly_ngwaf_rule_condition_value:visible').val(condition.value);


                    } else if (condition.type === 'multival') {

                        conditionMultivalOptions = config.rulePayload?.conditions[condition.field]?.multival_options ?? [];

                        if (conditionsElement.children('.ngwaf-condition, .ngwaf-condition-group').last().length) {
                            previousElement = conditionsElement.children('.ngwaf-condition, .ngwaf-condition-group').last()
                            additionType = 'after';

                        } else {
                            previousElement = conditionsElement;
                            additionType = '';
                        }

                        // Use existing method for addition, trigger event to ensure proper populate/display of elements

                        addSingleCondition(previousElement, additionType)
                        currentElement = conditionsElement.children('.ngwaf-condition').last()

                        currentElement.find('.fastly_ngwaf_rule_condition_field')
                            .val(condition.field).trigger('change');

                        currentElement.find('.fastly_ngwaf_rule_condition_field')
                            .val(condition.field).trigger('change');
                        currentElement.find('.fastly_ngwaf_rule_condition_operator')
                            .val(condition.operator).trigger('change');

                        // Simple conditions inside Multival - rendered under "main" multival condition
                        if (condition.conditions && condition.conditions.length) {

                            currentElement.find('[name="fastly_ngwaf_rule_multival_condition_operator"]')
                                .val(condition.group_operator);

                            let multivalConditions = currentElement.find('.ngwaf-multival-conditions');
                            multivalConditions.find(".ngwaf-condition").remove()

                            $.each(condition.conditions ?? [], function(index, multivalCondition) {

                                // Use existing method for addition, trigger event to ensure proper populate/display of elements

                                addMultivalCondition(
                                    multivalConditions,
                                    config.rulePayload?.conditions[condition.field]?.multival_options ?? []
                                )

                                currentElement = multivalConditions.find('.ngwaf-condition').last()

                                currentElement.find('.fastly_ngwaf_multival_rule_condition_field')
                                    .val(multivalCondition.field).trigger('change');
                                currentElement.find('.fastly_ngwaf_multival_rule_condition_operator')
                                    .val(multivalCondition.operator).trigger('change');
                                currentElement.find('.fastly_ngwaf_multival_rule_condition_value:visible')
                                    .val(multivalCondition.value);

                            })

                        }

                    } else if (condition.type === 'group') {

                        if (conditionsElement.children('.ngwaf-condition, .ngwaf-condition-group').last().length) {
                            previousElement = conditionsElement.children('.ngwaf-condition, .ngwaf-condition-group').last();
                        } else {
                            previousElement = conditionsElement;
                            isFirstElement = true;
                        }

                        // Use existing method for addition, trigger event to ensure proper populate/display of elements

                        addGroupCondition(previousElement, isFirstElement)

                        currentGroupElement = conditionsElement.children('.ngwaf-condition-group').last()
                        currentGroupElement.find('[name="fastly_ngwaf_rule_group_condition_operator"]').val(condition.group_operator);
                        currentGroupElement.find('.ngwaf-group-conditions').find(".ngwaf-condition").remove()

                        currentGroupElement = currentGroupElement.find('.ngwaf-group-conditions');
                        additionType = 'append';

                        // Simple conditions inside Group - rendered under group element

                        $.each(condition.conditions ?? [], function(index, groupCondition) {

                            // Use existing method for addition, trigger event to ensure proper populate/display of elements

                            addSingleCondition(currentGroupElement, additionType)
                            currentElement = currentGroupElement.find('.ngwaf-condition').last()

                            currentElement.find('.fastly_ngwaf_rule_condition_field')
                                .val(groupCondition.field).trigger('change');
                            currentElement.find('.fastly_ngwaf_rule_condition_operator')
                                .val(groupCondition.operator).trigger('change');
                            currentElement.find('.fastly_ngwaf_rule_condition_value:visible').val(groupCondition.value);

                            // Group condition can have multival condition as "child" - render it using existing logic
                            if (groupCondition.conditions && groupCondition.conditions.length) {

                                currentGroupElement.find('[name="fastly_ngwaf_rule_multival_condition_operator"]')
                                    .val(groupCondition.group_operator);

                                let multivalConditions = currentGroupElement.find('.ngwaf-multival-conditions');
                                multivalConditions.find(".ngwaf-condition").remove()


                                $.each(groupCondition.conditions ?? [], function(index, multivalCondition) {

                                    addMultivalCondition(
                                        multivalConditions,
                                        config.rulePayload?.conditions[groupCondition.field]?.multival_options ?? []
                                    )

                                    currentElement = multivalConditions.find('.ngwaf-condition').last()

                                    currentElement.find('.fastly_ngwaf_multival_rule_condition_field')
                                        .val(multivalCondition.field).trigger('change');
                                    currentElement.find('.fastly_ngwaf_multival_rule_condition_operator')
                                        .val(multivalCondition.operator).trigger('change');
                                    currentElement.find('.fastly_ngwaf_multival_rule_condition_value:visible')
                                        .val(multivalCondition.value);

                                })

                            }
                        })

                    }

                })
            }

            ruleModal.modal('openModal');
        }

        function createRule() {

            let ruleForm = $('#fastly-rule-modal-content fieldset');

            let conditions = [];
            let groupConditions = [];
            let multivalConditions = [];

            let ruleId = ruleForm.find('#fastly_ngwaf_rule_id').val()

            ruleForm.children('.ngwaf-conditions').children('.ngwaf-condition').each(function () {

                // Condition field has a similar structure like group - "conditions" subproperty
                if ($(this).find('.ngwaf-condition-multival').length) {

                    multivalConditions = [];

                    $(this).find('.ngwaf-condition-multival .ngwaf-condition').each(function() {

                        multivalConditions.push({
                            'field': $(this).find('.fastly_ngwaf_multival_rule_condition_field').val(),
                            'operator': $(this).find('.fastly_ngwaf_multival_rule_condition_operator').val(),
                            'value': $(this).find('.fastly_ngwaf_multival_rule_condition_value:visible').val(),
                            'type': 'single'
                        })
                    })

                    conditions.push({
                        'field': $(this).find('.fastly_ngwaf_rule_condition_field').val(),
                        'operator': $(this).find('.fastly_ngwaf_rule_condition_operator').val(),
                        'group_operator': $(this).find("select[name='fastly_ngwaf_rule_multival_condition_operator']").val(),
                        'type': 'multival',
                        'conditions': multivalConditions
                    })

                } else {

                    conditions.push({
                        'field': $(this).find('.fastly_ngwaf_rule_condition_field').val(),
                        'operator': $(this).find('.fastly_ngwaf_rule_condition_operator').val(),
                        'value': $(this).find('.fastly_ngwaf_rule_condition_value:visible').val(),
                        'type': 'single'
                    })
                }
            })

            ruleForm.children('.ngwaf-conditions').children('.ngwaf-condition-group').each(function () {

                groupConditions = [];

                // Break down all rules inside a group. Group can also contain multival conditions, hence double .each loop
                $(this).children('.ngwaf-group-conditions').children('.ngwaf-condition').each(function() {

                    if ($(this).find('.ngwaf-condition-multival').length) {

                        multivalConditions = [];

                        $(this).find('.ngwaf-condition-multival .ngwaf-condition').each(function() {

                            multivalConditions.push({
                                'field': $(this).find('.fastly_ngwaf_multival_rule_condition_field').val(),
                                'operator': $(this).find('.fastly_ngwaf_multival_rule_condition_operator').val(),
                                'value': $(this).find('.fastly_ngwaf_multival_rule_condition_value:visible').val(),
                                'type': 'single'
                            })
                        })

                        groupConditions.push({
                            'field': $(this).find('.fastly_ngwaf_rule_condition_field').val(),
                            'operator': $(this).find('.fastly_ngwaf_rule_condition_operator').val(),
                            'group_operator': $(this).find("select[name='fastly_ngwaf_rule_multival_condition_operator']").val(),
                            'type': 'multival',
                            'conditions': multivalConditions
                        })

                    } else {

                        groupConditions.push({
                            'field': $(this).find('.fastly_ngwaf_rule_condition_field').val(),
                            'operator': $(this).find('.fastly_ngwaf_rule_condition_operator').val(),
                            'value': $(this).find('.fastly_ngwaf_rule_condition_value:visible').val(),
                            'type': 'single'
                        })
                    }
                });

                conditions.push({
                    'type': 'group',
                    'group_operator': $(this).find("select[name='fastly_ngwaf_rule_group_condition_operator']").val(),
                    'conditions': groupConditions
                });

            })

            let ruleType = ruleForm.find('#fastly_ngwaf_rule_type').val()

            let payload = {
                'conditions': conditions,
                'description': ruleForm.find('#fastly_ngwaf_rule_description').val(),
                'enabled': ruleForm.find('#fastly_ngwaf_rule_enabled').val() === 'true',
                'group_operator': ruleForm.find('#fastly_ngwaf_rule_condition_match_operator').val(),
                'type': ruleType,
            };

            let actions = [];

            // Actions payload differs based on rule type and selected options, so adjustments are needed
            if (ruleType === 'request') {

                // Request is the only type which can have multiple actions
                payload.request_logging = ruleForm.find('#fastly_ngwaf_rule_request_logging').val()

                let actionFields = ruleForm.find('.fastly-ngwaf-rule-action');

                $.each(actionFields, function(key, element) {

                    let actionType = $(element).find('.fastly_ngwaf_rule_action_field').val();

                    if (actionType === 'deception') {

                        actions.push({
                            'type': actionType,
                            'deception_type': $(element).find('.fastly_ngwaf_rule_action_value').val()
                        })

                    } else if (actionType === 'add_signal') {
                        actions.push({
                            'type': actionType,
                            'signal': $(element).find('.fastly_ngwaf_rule_action_value').val()
                        })

                    } else if (actionType === 'browser_challenge') {
                        actions.push({
                            'type': actionType,
                            'allow_interactive': $(element).find('.fastly_ngwaf_rule_action_value').val()
                        })

                    } else {
                        actions.push({
                            'type': actionType,
                        })
                    }
                })

            } else if (ruleType === 'signal') {

                actions.push({
                    'type': ruleForm.find('.fastly_ngwaf_rule_action_field').val(),
                    'signal': ruleForm.find('.fastly_ngwaf_rule_action_value').val(),
                })

            } else if (ruleType === 'rate_limit') {

                let rateLimitActionMatch = ruleForm.find('#fastly_ngwaf_rule_rate_limit_action_match_type').val();
                let rateLimitFormType = ruleForm.find('#fastly_ngwaf_rule_rate_limit_action_field').val();

                let rateLimitAction = {};

                // Rate limit action payload differs based on selected condition
                if (rateLimitActionMatch === 'OTHER-SIGNAL') {

                    rateLimitAction = {
                        'type': rateLimitFormType,
                        'signal': ruleForm.find('#fastly_ngwaf_rule_rate_limit_action_other_signal_type').val()
                    }

                } else if (rateLimitActionMatch === 'ALL-REQUESTS') {

                    rateLimitAction = {
                        'type': rateLimitFormType,
                        'signal': rateLimitActionMatch
                    }

                } else if (rateLimitActionMatch === 'RULE-CONDITION') {

                    rateLimitAction = {
                        'type': rateLimitFormType,
                        'signal': ruleForm.find('#fastly_ngwaf_rule_rate_limit_threshold_signal').val()
                    }
                }

                if (rateLimitFormType === 'deception') {
                    rateLimitAction.deception_type = 'invalid_login_response';
                }

                actions.push(rateLimitAction);

                let clientIdentifierKey = ruleForm.find('#fastly_ngwaf_rule_rate_limit_client_identifier').val()
                let clientIdentifiers = [];

                // Client identifier doesn't have universal payload, it needs to be adjusted for each type
                if (clientIdentifierKey === 'signal_payload') {

                    clientIdentifiers.push({
                        'type': clientIdentifierKey,
                        'signal':  ruleForm.find("select[name='fastly_ngwaf_rule_rate_limit_client_identifier_select_value']").val()
                    })

                } else if (clientIdentifierKey === 'ip') {

                    clientIdentifiers.push({
                        'type': clientIdentifierKey
                    })

                } else {
                    clientIdentifiers.push({
                        'type': clientIdentifierKey,
                        'name':  ruleForm.find("input[name='fastly_ngwaf_rule_rate_limit_client_identifier_input_value']").val()
                    })
                }

                payload.rate_limit = {
                    'duration': ruleForm.find('#fastly_ngwaf_rule_rate_limit_duration').val(),
                    'interval': ruleForm.find('#fastly_ngwaf_rule_rate_limit_interval').val(),
                    'signal': ruleForm.find('#fastly_ngwaf_rule_rate_limit_threshold_signal').val(),
                    'threshold': ruleForm.find('#fastly_ngwaf_rule_rate_limit_threshold').val(),
                    'client_identifiers': clientIdentifiers
                }

            }

            payload.actions = actions;

            let errorMessageDivRuleEdit = $('#fastly-error-ngwaf-rule-edit-form');

            $.ajax({
                type: 'POST',
                url: config.editRuleUrl,
                data: {
                    'rule_id': ruleId,
                    'workspace_id': workspaceIdElement.val(),
                    'rule_payload': payload
                },
                showLoader: true,

                success: function (response) {

                    if ( (response.status ?? false) === false) {
                        let errorMessage = response.msg ?? 'Error while updating custom rule';

                        errorMessageDivRuleEdit.show()
                        errorMessageDivRuleEdit.text('')
                        errorMessageDivRuleEdit.text(errorMessage)
                        successMessageDiv.hide()
                    }  else {

                        errorMessageDivRuleEdit.hide()
                        fetchRules()
                        displaySuccess('Custom rule updated')

                        ruleModal.modal('closeModal');

                    }

                },
                error: function (request, error) {
                    errorMessageDivRuleEdit.show()
                    errorMessageDivRuleEdit.text('')
                    errorMessageDivRuleEdit.text('Something went wrong while updating the rule, please try again')
                }
            })

        }

        function populateFormOptions() {

            // NGWAF creation/edit rule form
            let ruleTypeSelectElement = $('#fastly_ngwaf_rule_type');

            let ruleActionsAddButton = $('#ngwaf-add-rule-action-button');

            let rateLimitActionsElement = $('#fastly_ngwaf_rule_rate_limit_action_field');
            let rateLimitActionsMatchType = $('#fastly_ngwaf_rule_rate_limit_action_match_type');
            let rateLimitActionsValueElement = $('#fastly_ngwaf_rule_rate_limit_action_other_signal_type');
            let rateLimitClientIdentifier = $('#fastly_ngwaf_rule_rate_limit_client_identifier');
            let rateLimitClientIdentifierValueBlock = $('.fastly-ngwaf-rule-rate-limit-client-identifier-value');
            let rateLimitThresholdSignal = $('#fastly_ngwaf_rule_rate_limit_threshold_signal');

            let requestRuleLogging = $('.rule-request-logging');
            let ruleActionsSection = $('.fastly-ngwaf-rule-actions');
            let rateLimitActionsSection = $('.fastly-ngwaf-rule-rate-limit-actions');
            let rateLimitDetailsSection = $('.fastly-ngwaf-rule-rate-limit-details');

            // Delete simple condition
            $(document).off("click", '.ngwaf-fastly-delete-rule-condition-action')
                .on("click", '.ngwaf-fastly-delete-rule-condition-action', function() {

                deleteCondition($(this).parents('.ngwaf-condition'));
            })

            // Delete multival condition
            $(document).off("click", '.ngwaf-fastly-delete-multival-rule-condition-action')
                .on("click", '.ngwaf-fastly-delete-multival-rule-condition-action', function() {

                deleteCondition($(this).parent('.ngwaf-condition'));
            })


            // Delete group condition
            $(document).off("click", '.ngwaf-fastly-delete-condition-group-action')
                .on("click", '.ngwaf-fastly-delete-condition-group-action', function() {

                deleteCondition($(this).parents('.ngwaf-condition-group'));
            })

            // Delete action - visible when rule type is request
            $(document).off("click", '.ngwaf-fastly-delete-rule-action')
                .on("click", '.ngwaf-fastly-delete-rule-action', function() {

                    deleteAction($(this).parents('.fastly-ngwaf-rule-action'));
                })

            // Adding simple condition inside multival condition type
            $(document).off("click", '.ngwaf-fastly-add-multival-rule-condition-action')
                .on("click", '.ngwaf-fastly-add-multival-rule-condition-action', function () {

                    // Fetch multival condition options and render new condition
                    let multivalConditionsElement = $(this).siblings('.ngwaf-multival-conditions');
                    let currentConditionType = $(this).parents('.ngwaf-condition').find("select[name='fastly_ngwaf_rule_condition_field[]']").val();
                    let multivalOptions = config.rulePayload?.conditions[currentConditionType]?.multival_options ?? []

                    addMultivalCondition(multivalConditionsElement, multivalOptions);

                    let numberOfConditions = $(this).siblings('.ngwaf-multival-conditions').children('.ngwaf-condition').length || 0;

                    if (numberOfConditions >= NUMBER_OF_CONDITIONS_LIMIT) {
                        $(this).prop('disabled', true);
                        $(this).siblings('.ngwaf-fastly-add-rule-condition-group-action').prop('disabled', true);
                    }
            })

            // Add simple condition
            $(document).off("click", '.ngwaf-fastly-add-rule-condition-action')
                .on("click", '.ngwaf-fastly-add-rule-condition-action',function () {

                    let numberOfConditions;
                    let previousElement;
                    let additionType;

                    // If condition is being added to already existing list, add it to the end
                    if ($(this).siblings('.ngwaf-condition, .ngwaf-condition-group').last().length) {

                        previousElement = $(this).siblings('.ngwaf-condition, .ngwaf-condition-group').last();
                        additionType = 'after';

                        addSingleCondition(previousElement, additionType);

                        numberOfConditions = $(this).siblings('.ngwaf-condition, .ngwaf-condition-group').length || 0;

                    } else if ($(this).siblings('.ngwaf-group-conditions').length) {

                        // If condition is being added inside group, append it inside group conditions element
                        previousElement = $(this).siblings('.ngwaf-group-conditions');
                        additionType = 'append';

                        addSingleCondition(previousElement, additionType);

                        numberOfConditions = $(this).siblings('.ngwaf-group-conditions').children('.ngwaf-condition').length || 0;

                    } else {

                        // If it is first condition on the list, add it to the beginning of parent
                        previousElement = $(this).parent();
                        additionType = 'prepend';
                        addSingleCondition(previousElement, additionType);

                        numberOfConditions = $(this).siblings('.ngwaf-condition, .ngwaf-condition-group').length || 0;
                    }

                    if (numberOfConditions >= NUMBER_OF_CONDITIONS_LIMIT) {
                        $(this).prop('disabled', true);
                        $(this).siblings('.ngwaf-fastly-add-rule-condition-group-action').prop('disabled', true);
                    }

            })

            // Add group condition
            $(document).off("click", '.ngwaf-fastly-add-rule-condition-group-action')
                .on("click", '.ngwaf-fastly-add-rule-condition-group-action',function () {

                    let previousElement;
                    let isFirstElement = false;

                    // Determine the place where condition should be inserted
                    if ($(this).siblings('.ngwaf-condition').last().length) {
                        previousElement = $(this).siblings('.ngwaf-condition').last();
                    } else {
                        previousElement = $(this).parent();
                        isFirstElement = true;
                    }

                    addGroupCondition(previousElement, isFirstElement)

                    let numberOfConditions = $(this).siblings('.ngwaf-condition, .ngwaf-condition-group').length || 0;

                    if (numberOfConditions >= NUMBER_OF_CONDITIONS_LIMIT) {
                        $(this).prop('disabled', true);
                        $(this).siblings('.ngwaf-fastly-add-rule-condition-action').prop('disabled', true);
                    }

            })

            // Action type change
            $(document).off("change", '.fastly_ngwaf_rule_action_field')
                .on("change", '.fastly_ngwaf_rule_action_field',function () {

                let selectedRuleType = ruleTypeSelectElement.val();
                let selectedActionType = $(this).val();

                let optionsForAction = config.rulePayload?.actions[selectedRuleType]?.[selectedActionType]?.options ?? [];

                // string is used instead of array in places where options are not fixed, instead they load dynamically
                if (typeof optionsForAction === 'string') {
                    optionsForAction = selectOptions?.[optionsForAction] ?? [];
                }

                let ruleActionsValueBlock = $(this).closest('.fastly-ngwaf-rule-action')
                    .find('.fastly_ngwaf_rule_action_value_block');
                let ruleActionsValueElement = $(this).closest('.fastly-ngwaf-rule-action')
                    .find('.fastly_ngwaf_rule_action_value');

                // Determine if select element should be displayed
                if (!optionsForAction.length) {
                    ruleActionsValueBlock.hide()
                    ruleActionsValueElement.empty().hide()
                } else {

                    ruleActionsValueElement.empty()

                    $.each(optionsForAction, function(key, value) {

                        ruleActionsValueElement.append(
                            $('<option>', { value: value.id, text: value.display_name })
                        );
                    });

                    ruleActionsValueBlock.show()
                    ruleActionsValueElement.show()

                }
            })

            // If selected value has additional options, display select element in which those options can be selected
            rateLimitActionsMatchType.on("change", function() {
                let hasOptions = $(this).find(':selected').data('has-options');

                if (hasOptions) {
                    $(this).parents('.rate-limit-action-value-selection').find('.rate-limit-action-value-option').show()
                } else {
                    $(this).parents('.rate-limit-action-value-selection').find('.rate-limit-action-value-option').hide()
                }
            })

            // Rate limit action tyep change
            rateLimitActionsElement.on("change", function() {

                let selectedRuleType = ruleTypeSelectElement.val();
                let selectedActionType = $(this).val();

                let optionsForAction = config.rulePayload?.actions[selectedRuleType]?.[selectedActionType]?.options ?? [];

                // string is used instead of array in places where options are not fixed, instead they load dynamically
                if (typeof optionsForAction === 'string') {
                    optionsForAction = selectOptions?.[optionsForAction] ?? [];
                }

                // Determine if select element for "Action Signals" should be displayed
                if (!optionsForAction.length) {
                    rateLimitActionsValueElement.empty().hide()
                } else {

                    rateLimitActionsValueElement.empty()

                    $.each(optionsForAction, function(key, value) {

                        rateLimitActionsValueElement.append(
                            $('<option>', { value: value.id, text: value.display_name })
                        );
                    });

                    rateLimitActionsValueElement.show()

                }
            })

            // Rule type, "main" select option
            ruleTypeSelectElement.on("change", function() {
                let selectedValue = $(this).val();
                let actionsElement;

                // On rate limit, hide action sections related to signals and request
                if (selectedValue === 'rate_limit') {
                    ruleActionsSection.hide();
                    rateLimitActionsSection.show();
                    rateLimitDetailsSection.show();

                    actionsElement = rateLimitActionsElement;
                } else {
                    ruleActionsSection.show();
                    rateLimitActionsSection.hide();
                    rateLimitDetailsSection.hide();

                    actionsElement = $('.fastly_ngwaf_rule_action_field').first();

                }

                // Logging is specific for reuqest type
                if (selectedValue === 'request') {
                    requestRuleLogging.show()
                } else {
                    requestRuleLogging.hide()
                }

                displayAddActionButton(ruleActionsAddButton, selectedValue)
                populateActionsField(actionsElement, selectedValue);

            })

            ruleActionsAddButton.on('click', function () {

                addActionField(ruleTypeSelectElement.val());

            })

            // Operator inside multival condition change
            $(document).off("change", '.fastly_ngwaf_multival_rule_condition_operator')
                .on("change", '.fastly_ngwaf_multival_rule_condition_operator',function() {

                let selectedValue = $(this).val();

                let currentConditionType = $(this).parents('.ngwaf-condition').find("select[name='fastly_ngwaf_multival_rule_condition_field[]']").val();
                let selectOptionValues = config.rulePayload?.multival_parameters[currentConditionType]?.options ?? '';

                let conditionInputValue = $(this).closest('.ngwaf-condition').find("input[name='fastly_ngwaf_multival_rule_condition_value[]']")
                let conditionInputSelect = $(this).closest('.ngwaf-condition').find("select[name='fastly_ngwaf_multival_rule_condition_value[]']")

                // In list and Not in list operators have select options, so we render select element
                if (selectedValue === 'in_list' || selectedValue === 'not_in_list') {

                    selectOptionValues = selectOptions?.[selectOptionValues] ?? [];
                    conditionInputValue.empty().hide()
                    conditionInputSelect.empty()

                    $.each(selectOptionValues, function(key, value) {
                        conditionInputSelect.append(
                            $('<option>', { value: value.reference_id, text: value.name })
                        );
                    });

                    conditionInputSelect.show()

                } else if (currentConditionType === 'signal_id' &&
                    (selectedValue === 'equals' || selectedValue === 'does_not_equal'))
                {

                    // Signal ID is the only condition type which has select options for Equals and Does not Equal options

                    // secondary_options is custom property added for this - options property is already populated
                    selectOptionValues = config.rulePayload?.multival_parameters[currentConditionType]?.secondary_options ?? '';
                    selectOptionValues = selectOptions?.[selectOptionValues] ?? [];
                    conditionInputValue.empty().hide()
                    conditionInputSelect.empty()

                    $.each(selectOptionValues, function(key, value) {
                        conditionInputSelect.append(
                            $('<option>', { value: value.reference_id ?? value.id, text: value.display_name })
                        );
                    });

                    conditionInputSelect.show()

                } else {

                    let selectOptionValues = []; // no select options in multival fields
                    toggleInputElementForRuleValue(currentConditionType, conditionInputValue, conditionInputSelect, selectOptionValues)
                }

            })

            // Simple condition operator change
            $(document).off("change", '.fastly_ngwaf_rule_condition_operator')
                .on("change", '.fastly_ngwaf_rule_condition_operator',function() {

                let selectedValue = $(this).val();

                let currentConditionType = $(this).parents('.ngwaf-condition').find("select[name='fastly_ngwaf_rule_condition_field[]']").val();
                let selectOptionValues = config.rulePayload?.conditions[currentConditionType]?.options ?? '';
                let conditionValueSection = $(this).parents('.ngwaf-condition').find(".ngwaf-condition-value-section")
                let conditionInputValue = $(this).parents('.ngwaf-condition').find("input[name='fastly_ngwaf_rule_condition_value[]']")
                let conditionInputSelect = $(this).parents('.ngwaf-condition').find("select[name='fastly_ngwaf_rule_condition_value[]']")

                // In list and Not in list operators have select options, so we render select element and hide input
                if (selectedValue === 'in_list' || selectedValue === 'not_in_list') {

                    conditionValueSection.show()
                    selectOptionValues = selectOptions?.[selectOptionValues] ?? [];
                    $(this).parents('.ngwaf-condition').find(".ngwaf-condition-multival").remove()
                    conditionInputValue.empty().hide()
                    conditionInputSelect.empty()

                    $.each(selectOptionValues, function(key, value) {
                        conditionInputSelect.append(
                            $('<option>', { value: value.reference_id, text: value.name })
                        );
                    });

                    conditionInputSelect.show()

                } else if (selectedValue === 'exists' || selectedValue === 'does_not_exist') {

                    // These conditions are used only in multival conditions - render multival form
                    if(!$(this).parents('.ngwaf-condition').find(".ngwaf-condition-multival").length) {
                        let conditionMultivalOptions = config.rulePayload?.conditions[currentConditionType]?.multival_options ?? []
                        displayMultivalForm($(this).parents('.ngwaf-condition'), conditionMultivalOptions)
                    }

                } else {
                    conditionValueSection.show()

                    $(this).parents('.ngwaf-condition').find(".ngwaf-condition-multival").remove()
                    let selectOptionValues = config.rulePayload?.conditions[currentConditionType]?.select_options ?? []
                    toggleInputElementForRuleValue(currentConditionType, conditionInputValue, conditionInputSelect, selectOptionValues)
                }

            })

            // Multival condition type
            $(document).off("change", '.fastly_ngwaf_multival_rule_condition_field')
                .on("change", '.fastly_ngwaf_multival_rule_condition_field',function() {

                let selectedValue = $(this).val();
                let conditionInputValue = $(this).closest('.ngwaf-condition').find("input[name='fastly_ngwaf_multival_rule_condition_value[]']")
                let conditionInputSelect = $(this).closest('.ngwaf-condition').find("select[name='fastly_ngwaf_multival_rule_condition_value[]']")

                let conditionOptions = config.rulePayload?.multival_parameters[selectedValue]?.conditions ?? [];

                let ruleConditionOperator = $(this).closest('.ngwaf-condition').find("select[name='fastly_ngwaf_multival_rule_condition_operator[]']")
                ruleConditionOperator.empty()
                $.each(conditionOptions, function(key, value) {
                    ruleConditionOperator.append(
                        $('<option>', { value: key, text: value })
                    );
                });

                let selectOptionValues = config.rulePayload?.conditions[selectedValue]?.multival_options ?? []
                toggleInputElementForRuleValue(selectedValue, conditionInputValue, conditionInputSelect, selectOptionValues);

                // Trigger operator change to activate populate options of Value element
                ruleConditionOperator.trigger('change')

            });

            // Change of condition type field
            $(document).off("change", '.fastly_ngwaf_rule_condition_field')
                .on("change", '.fastly_ngwaf_rule_condition_field',function() {

                let selectedValue = $(this).val();
                let conditionInputValue = $(this).parents('.ngwaf-condition').find("input[name='fastly_ngwaf_rule_condition_value[]']")
                let conditionInputSelect = $(this).parents('.ngwaf-condition').find("select[name='fastly_ngwaf_rule_condition_value[]']")
                let multivalElement = $(this).parents('.ngwaf-condition').find(".ngwaf-condition-multival");

                let conditionOptions = config.rulePayload?.conditions[selectedValue]?.conditions ?? [];

                // Populate Operator select element with values for current condition field
                let ruleConditionOperator = $(this).parents('.ngwaf-condition').find("select[name='fastly_ngwaf_rule_condition_operator[]']")
                ruleConditionOperator.empty()
                $.each(conditionOptions, function(key, value) {
                    ruleConditionOperator.append(
                        $('<option>', { value: key, text: value })
                    );
                });

                if ($(this).parents('.ngwaf-multival-conditions').length) {

                    // Condition inside multival element list
                    let originalConditionValue = $(this).parents('.ngwaf-condition-multival').
                    parent('.ngwaf-condition').
                    find('.fastly_ngwaf_rule_condition_field:first').val()

                    let conditionMultivalOptions = config.rulePayload?.conditions[originalConditionValue]?.multival_options ?? []
                    displayMultivalForm($(this).parents('.ngwaf-condition'), conditionMultivalOptions)
                } else if (conditionOptions['exists'] || conditionOptions['does_not_exist']) {

                    // Element with these options is multival element - remove current form and rerender new one
                    multivalElement.remove()
                    let conditionMultivalOptions = config.rulePayload?.conditions[selectedValue]?.multival_options ?? []
                    displayMultivalForm($(this).parents('.ngwaf-condition'), conditionMultivalOptions)

                } else  {

                    // Simple condition is selected - remove multival element and render Value element
                    multivalElement.remove()
                    $(this).parents('.ngwaf-condition').find(".ngwaf-condition-value-section").show()
                    let selectOptionValues = config.rulePayload?.conditions[selectedValue]?.select_options ?? []
                    toggleInputElementForRuleValue(selectedValue, conditionInputValue, conditionInputSelect, selectOptionValues);
                }
            });

            // Change on identifier element for rate limit
            rateLimitClientIdentifier.on("change", function() {

                let selectedValue = $(this).val();

                let inputValueElement = $(this).parents('.fastly-ngwaf-rule-rate-limit-details')
                    .find("input[name='fastly_ngwaf_rule_rate_limit_client_identifier_input_value']")

                let selectValueElement = $(this).parents('.fastly-ngwaf-rule-rate-limit-details')
                    .find("select[name='fastly_ngwaf_rule_rate_limit_client_identifier_select_value']")

                let clientIdentifier = config.rulePayload?.rate_limit_identifiers[selectedValue] ?? [];

                // If identifier doesn't have value, don't display that block
                if (!clientIdentifier.has_value) {
                    rateLimitClientIdentifierValueBlock.hide();
                } else if (!clientIdentifier.options) {
                    // If there is no options, display input element
                    rateLimitClientIdentifierValueBlock.show()
                    inputValueElement.empty().show()
                    selectValueElement.empty().hide()
                } else if (typeof clientIdentifier.options === 'string') {

                    // Load and render select options
                    rateLimitClientIdentifierValueBlock.show()
                    inputValueElement.empty().hide()

                    let options = selectOptions?.[clientIdentifier.options] ?? [];
                    selectValueElement.empty()

                    $.each(options, function(key, value) {
                        selectValueElement.append(
                            $('<option>', { value: value.id, text: value.display_name })
                        );
                    });

                    selectValueElement.show()
                }
            })


            // Populate rule type selection
            if (ruleTypeSelectElement && config.rulePayload?.rule_types) {

                ruleTypeSelectElement.empty()
                $.each(config.rulePayload.rule_types, function(key, value) {
                    ruleTypeSelectElement.append(
                        $('<option>', { value: key, text: value })
                    );
                });

                ruleTypeSelectElement.trigger('change')
            }

            let ruleConditionField = $('.fastly_ngwaf_rule_condition_field')
            initializeRuleConditionField(ruleConditionField);

            // Populate values for rate limit identifier options
            if (rateLimitClientIdentifier && config.rulePayload?.rate_limit_identifiers) {
                rateLimitClientIdentifier.empty()

                $.each(config.rulePayload?.rate_limit_identifiers, function(key, value) {
                    rateLimitClientIdentifier.append(
                        $('<option>', { value: key, text: value.name, 'data-rate-lmit-identifier-type': value.input_parameter_name })
                    );
                });

                rateLimitClientIdentifier.trigger('change')
            }

            // Populate values for "Threshold Signal" options
            if (rateLimitThresholdSignal) {

                rateLimitThresholdSignal.empty()

                $.each(selectOptions?.['custom_signal_options'] ?? [], function(key, value) {
                    rateLimitThresholdSignal.append(
                        $('<option>', { value: value.id, text: value.display_name })
                    );
                });
            }
        }

        function initializeRuleConditionField(ruleConditionField, isMultival = false, multivalOptions = []) {

            // If current condition is "simple", render condition options from from rule provider
            if (ruleConditionField && !isMultival && config.rulePayload?.conditions) {
                ruleConditionField.empty()
                $.each(config.rulePayload.conditions, function(key, value) {
                    ruleConditionField.append(
                        $('<option>', { value: key, text: value.name, 'data-rule-condition-type': value.type })
                    );
                });

            } else if (ruleConditionField && isMultival && config.rulePayload?.multival_parameters) {

                // If current condition is multival, load options from different property of rule provider and display
                // them in condition field
                ruleConditionField.empty()
                let multivalConfig;

                $.each(multivalOptions, function(key, value) {

                    multivalConfig = config.rulePayload?.multival_parameters[value] ?? null;

                    if (!multivalConfig) {
                        return true; // skip this iteration
                    }

                    ruleConditionField.append(
                        $('<option>', { value: value, text: multivalConfig.name, 'data-rule-condition-type': multivalConfig.type })
                    );
                });
            }

            ruleConditionField.trigger('change')
        }

        function deleteCondition(currentCondition) {
            let addConditionButton = currentCondition.siblings('.ngwaf-fastly-add-rule-condition-action')
            let addConditionGroupButton = currentCondition.siblings('.ngwaf-fastly-add-rule-condition-group-action')
            let addConditionInGroupButton = currentCondition.parent().siblings('.ngwaf-fastly-add-rule-condition-action')
            let addConditionMultivalButton = currentCondition.parent().siblings('.ngwaf-fastly-add-multival-rule-condition-action')

            // Remove current condition element and enable Add condition button (we are below rule limit after deletion)
            currentCondition.remove()
            addConditionButton.prop('disabled', false);
            addConditionMultivalButton.prop('disabled', false);
            addConditionGroupButton.prop('disabled', false);
            addConditionInGroupButton.prop('disabled', false);
        }

        function deleteAction(currentAction) {

            // Remove current action and enable Add action button (we are below action limit after deletion)
            currentAction.remove()
            $("#ngwaf-add-rule-action-button").prop('disabled', false);
        }

        function displayMultivalForm(parentElement, conditionMultivalOptions) {

            let elementToInsert = $(
                `<div class="ngwaf-condition-multival">
                    <div class="admin__field field   fastly-ngwaf-rule-multival-operator-block">
                        <label class="admin__field-label">
                            <span>Rule applies if X conditions are true</span>
                        </label>
                        <div class="admin__field-control">
                            <select name="fastly_ngwaf_rule_multival_condition_operator" class="admin__control-text">
                                <option value="all" selected>All</option>
                                <option value="any">Any</option>
                            </select>
                        </div>
                    </div>

                    <div class="ngwaf-multival-conditions">
                        <div class="ngwaf-condition">
                            <div class="field   condition-element">
                                <label class="admin__field-label">
                                    <span>Field</span>
                                </label>
                                <div class="admin__field-control">
                                    <select name="fastly_ngwaf_multival_rule_condition_field[]" class="admin__control-text fastly_ngwaf_multival_rule_condition_field">
                                    </select>
                                </div>
                            </div>
                            <div class="field   condition-element">
                                <label class="admin__field-label">
                                    <span>Operator</span>
                                </label>
                                <div class="admin__field-control">
                                    <select name="fastly_ngwaf_multival_rule_condition_operator[]" class="admin__control-text fastly_ngwaf_multival_rule_condition_operator">
                                    </select>
                                </div>
                            </div>
                            <div class="field condition-element ngwaf-condition-value-section">
                                <label class="admin__field-label">
                                    <span>Value</span>
                                </label>
                                <div class="admin__field-control condition-input">
                                    <input type="text"
                                           name="fastly_ngwaf_multival_rule_condition_value[]"
                                           required="required"
                                           class="admin__control-text required-entry fastly_ngwaf_multival_rule_condition_value">
                                </div>
                                <div class="admin__field-control condition-select">
                                    <select name="fastly_ngwaf_multival_rule_condition_value[]"
                                            class="admin__control-text required-entry fastly_ngwaf_multival_rule_condition_value"
                                            required="required">
                                    </select>
                                </div>
                            </div>
                            <button class='action-delete ngwaf-delete fastly-delete-snippet-icon ngwaf-fastly-delete-multival-rule-condition-action'
                                    title='Delete Condition'
                                    type='button'></button>
                        </div>
                    </div>

                   <button class='ngwaf-rule-button ngwaf-fastly-add-multival-rule-condition-action'
                            title='Add Condition'
                            type='button'>Add condition</button>
            </div>`
            );

            // Multival for doesn't have value - it has Field, Operator and the list of simple conditions
            parentElement.find(".ngwaf-condition-value-section").hide()

            if (!parentElement.find('.ngwaf-condition-multival').length) {
                parentElement.append(elementToInsert)
            }

            // Extract condition and insert it using separate method
            let newRuleConditionField = elementToInsert.find(".fastly_ngwaf_multival_rule_condition_field");
            initializeRuleConditionField(newRuleConditionField, true, conditionMultivalOptions);

        }

        function toggleInputElementForRuleValue(selectedValue, conditionInputValue, conditionInputSelect, selectOptionValues) {

            // Display either input element or select element
            if (!selectOptionValues || !Object.keys(selectOptionValues).length) {
                conditionInputValue.empty().show()
                conditionInputSelect.empty().hide()
            } else {
                conditionInputValue.empty().hide()

                conditionInputSelect.empty()

                $.each(selectOptionValues, function (key, value) {
                    conditionInputSelect.append(
                        $('<option>', { value: key, text: value })
                    );
                });

                conditionInputSelect.show()

            }
        }

        function addMultivalCondition(multivalConditionsElement, multivalOptions) {

            let elementToInsert = $(
                `<div class="ngwaf-condition">
                        <div class="field condition-element">
                            <label class="admin__field-label">
                                <span>Field</span>
                            </label>
                            <div class="admin__field-control">
                                <select name="fastly_ngwaf_multival_rule_condition_field[]" class="admin__control-text fastly_ngwaf_multival_rule_condition_field">
                                </select>
                            </div>
                        </div>
                        <div class="field condition-element">
                            <label class="admin__field-label">
                                <span>Operator</span>
                            </label>
                            <div class="admin__field-control">
                                <select name="fastly_ngwaf_multival_rule_condition_operator[]" class="admin__control-text fastly_ngwaf_multival_rule_condition_operator">
                                </select>
                            </div>
                        </div>
                        <div class="field condition-element ngwaf-condition-value-section">
                            <label class="admin__field-label">
                                <span>Value</span>
                            </label>
                            <div class="admin__field-control condition-input">
                                <input type="text"
                                       name="fastly_ngwaf_multival_rule_condition_value[]"
                                       required="required"
                                       class="admin__control-text required-entry fastly_ngwaf_multival_rule_condition_value">
                            </div>
                            <div class="admin__field-control condition-select">
                                <select name="fastly_ngwaf_multival_rule_condition_value[]"
                                        class="admin__control-text required-entry fastly_ngwaf_multival_rule_condition_value"
                                        required="required">
                                </select>
                            </div>
                        </div>
                        <button class='action-delete ngwaf-delete fastly-delete-snippet-icon ngwaf-fastly-delete-multival-rule-condition-action'
                                title='Delete Condition'
                                type='button'></button>
                    </div>`
            );

            // Append new simple condition to current multival element and initialize rule options
            multivalConditionsElement.append(elementToInsert);

            let newRuleConditionField = elementToInsert.find(".fastly_ngwaf_multival_rule_condition_field");

            initializeRuleConditionField(newRuleConditionField, true, multivalOptions);

        }

        function addSingleCondition(previousElement, additionType) {

            let elementToInsert = $(
                `<div class="ngwaf-condition">
                        <div class="field   condition-element">
                            <label class="admin__field-label">
                                <span>Field</span>
                            </label>
                            <div class="admin__field-control">
                                <select name="fastly_ngwaf_rule_condition_field[]" class="admin__control-text fastly_ngwaf_rule_condition_field">
                                </select>
                            </div>
                        </div>
                        <div class="field   condition-element">
                            <label class="admin__field-label">
                                <span>Operator</span>
                            </label>
                            <div class="admin__field-control">
                                <select name="fastly_ngwaf_rule_condition_operator[]" class="admin__control-text fastly_ngwaf_rule_condition_operator">
                                </select>
                            </div>
                        </div>
                        <div class="field condition-element ngwaf-condition-value-section">
                            <label class="admin__field-label">
                                <span>Value</span>
                            </label>
                            <div class="admin__field-control condition-input">
                                <input type="text"
                                       name="fastly_ngwaf_rule_condition_value[]"
                                       required="required"
                                       class="admin__control-text required-entry fastly_ngwaf_rule_condition_value">
                            </div>
                            <div class="admin__field-control condition-select">
                                <select name="fastly_ngwaf_rule_condition_value[]"
                                        class="admin__control-text required-entry fastly_ngwaf_rule_condition_value"
                                        required="required">
                                </select>
                            </div>
                        </div>
                        <button class='action-delete ngwaf-delete fastly-delete-snippet-icon ngwaf-fastly-delete-rule-condition-action'
                                title='Delete Condition'
                                type='button'></button>
                    </div>`
            );


            if (additionType === 'after') {
                previousElement.after(elementToInsert)
            } else if (additionType === 'append') {
                previousElement.append(elementToInsert);
            } else {
                previousElement.prepend(elementToInsert);
            }

            let newRuleConditionField = elementToInsert.find(".fastly_ngwaf_rule_condition_field");
            initializeRuleConditionField(newRuleConditionField);

        }

        function addGroupCondition(previousElement, isFirstElement) {

            let elementToInsert = $(
                `<div class="ngwaf-condition-group">
                            <div class="admin__field field   fastly-ngwaf-rule-group-operator-block">
                                <label class="admin__field-label">
                                    <span>Rule applies if X conditions are true</span>
                                </label>
                                <div class="admin__field-control">
                                    <select name="fastly_ngwaf_rule_group_condition_operator" class="admin__control-text">
                                        <option value="all" selected>All</option>
                                        <option value="any">Any</option>
                                    </select>
                                </div>
                            </div>
                            <button class='action-delete ngwaf-delete fastly-delete-snippet-icon ngwaf-fastly-delete-condition-group-action'
                                    title='Delete Group'
                                    type='button'>Delete Group</button>

                            <div class="ngwaf-group-conditions">
                                <div class="ngwaf-condition">
                                    <div class="field   condition-element">
                                        <label class="admin__field-label">
                                            <span>Field</span>
                                        </label>
                                        <div class="admin__field-control">
                                            <select name="fastly_ngwaf_rule_condition_field[]" class="admin__control-text fastly_ngwaf_rule_condition_field">
                                            </select>
                                        </div>
                                    </div>
                                    <div class="field   condition-element">
                                        <label class="admin__field-label">
                                            <span>Operator</span>
                                        </label>
                                        <div class="admin__field-control">
                                            <select name="fastly_ngwaf_rule_condition_operator[]" class="admin__control-text fastly_ngwaf_rule_condition_operator">
                                            </select>
                                        </div>
                                    </div>
                                    <div class="field condition-element ngwaf-condition-value-section">
                                        <label class="admin__field-label">
                                            <span>Value</span>
                                        </label>
                                        <div class="admin__field-control condition-input">
                                            <input type="text"
                                                   name="fastly_ngwaf_rule_condition_value[]"
                                                   required="required"
                                                   class="admin__control-text required-entry fastly_ngwaf_rule_condition_value">
                                        </div>
                                        <div class="admin__field-control condition-select">
                                            <select name="fastly_ngwaf_rule_condition_value[]"
                                                    class="admin__control-text required-entry fastly_ngwaf_rule_condition_value"
                                                    required="required">
                                            </select>
                                        </div>
                                    </div>
                                    <button class='action-delete ngwaf-delete fastly-delete-snippet-icon ngwaf-fastly-delete-rule-condition-action'
                                            title='Delete Condition'
                                            type='button'></button>
                                </div>
                            </div>

                           <button class='ngwaf-rule-button ngwaf-fastly-add-rule-condition-action'
                                    title='Add Condition'
                                    type='button'>Add condition</button>
                    </div>`
            );


            if (isFirstElement) {
                previousElement.prepend(elementToInsert)
            } else {
                previousElement.after(elementToInsert);
            }

            let newRuleConditionField = elementToInsert.find(".fastly_ngwaf_rule_condition_field");
            initializeRuleConditionField(newRuleConditionField);
        }

        function displayAddActionButton(addActionButtonElement, selectedRuleType) {

            let deleteActionButtons = $('.ngwaf-fastly-delete-rule-action');

            // Add action button is displayed only for "request" type of rules
            if (selectedRuleType !== 'request') {
                addActionButtonElement.hide()
                deleteActionButtons.hide()
                $('.fastly-ngwaf-rule-action').not(':first').remove();
                return
            }

            deleteActionButtons.show();
            addActionButtonElement.show();

            if ($('.fastly-ngwaf-rule-action').length >= NUMBER_OF_ACTIONS_LIMIT) {
                addActionButtonElement.prop('disabled', true);
            } else {
                addActionButtonElement.prop('disabled', false);
            }
        }

        function populateActionsField(actionsElement, selectedRuleType) {

            let actionOptions = config.rulePayload?.actions[selectedRuleType] ?? [];

            actionsElement.empty()
            $.each(actionOptions, function(key, value) {
                actionsElement.append(
                    $('<option>', { value: key, text: value.name })
                );
            });

            // Trigger change to determine if value element should be displayed
            actionsElement.trigger('change')
        }

        function addActionField(selectedRuleType) {

            let elementToInsert = $(
                `<div class="fastly-ngwaf-rule-action">
                        <div class="action-input-fields">
                            <div class="admin__field field ">
                                <label class="admin__field-label">
                                    <span>Type</span>
                                </label>
                                <div class="admin__field-control">
                                    <select name="fastly_ngwaf_rule_action_field" class="fastly_ngwaf_rule_action_field admin__control-text">
                                    </select>
                                </div>
                            </div>
                            <div class="admin__field field  fastly_ngwaf_rule_action_value_block">
                                <label class="admin__field-label">
                                    <span>Value</span>
                                </label>
                                <div class="admin__field-control">
                                    <select name="fastly_ngwaf_rule_action_value" class="fastly_ngwaf_rule_action_value admin__control-text">
                                    </select>
                                </div>
                            </div>
                        </div>

                        <button class='action-delete ngwaf-delete fastly-delete-snippet-icon ngwaf-fastly-delete-rule-action'
                                title='Delete Action'
                                type='button'></button>
                    </div>`
            );

            let ruleActionsSection = $('.fastly-ngwaf-rule-actions');
            ruleActionsSection.append(elementToInsert);

            if (ruleActionsSection.find('.fastly-ngwaf-rule-action').length >= NUMBER_OF_ACTIONS_LIMIT) {
                $('#ngwaf-add-rule-action-button').prop('disabled', true);
            }

            let actionType = elementToInsert.find(".fastly_ngwaf_rule_action_field");

            populateActionsField(actionType, selectedRuleType)
        }

        /**
         * Fetch values for all select options elements (different signals, lists, logs, etc) and store it in variable
         * which is used inf different methods
         */
        function populateSelectFieldOptions() {

            if (selectOptions === undefined) {

                $.ajax({
                    type: 'GET',
                    url: config.ruleSelectOptionsUrl,
                    showLoader: true,
                    data: {
                        'workspace_id': workspaceIdElement.val()
                    },
                    async: false, // necessary to prepopulate options on elements before form is displayed
                    success: function (response) {


                        if ( (response.status ?? false) === false) {
                            selectOptions = [];
                        }  else {
                            selectOptions = response.options ?? [];
                        }

                    },
                    error: function (request, error) {

                        displayError("Something went wrong while fetching select options");
                    }
                })
            }
        }
    }
});
