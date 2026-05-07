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

        let selectOptions = undefined;

        ngWafHead.one('click', function () {
            fetchRules();
        });

        newRuleButton.on('click', function () {
            createRuleModal();
            populateSelectFieldOptions();
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

            let ruleForm = $('#fastly-rule-modal-content fieldset');

            let conditions = [];
            let groupConditions = [];
            let multivalConditions = [];
            let conditionsObject;

            ruleForm.children('.ngwaf-conditions').children('.ngwaf-condition').each(function () {

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

                conditionsObject = {
                    'type': 'group',
                    'group_operator': $(this).find("select[name='fastly_ngwaf_rule_group_condition_operator']").val(),
                    'conditions': groupConditions
                }

                conditions.push(conditionsObject);

            })

            let ruleType = ruleForm.find('#fastly_ngwaf_rule_type').val()

            let payload = {
                'conditions': conditions,
                'description': ruleForm.find('#fastly_ngwaf_rule_description').val(),
                'enabled': ruleForm.find('#fastly_ngwaf_rule_enabled').val() === 'true',
                'group_operator': ruleForm.find('#fastly_ngwaf_rule_condition_match_operator').val(),
                'type': ruleForm.find('#fastly_ngwaf_rule_type').val(),
            };

            let actions = [];

            if (ruleType === 'request') {
                payload.request_logging = ruleForm.find('#fastly_ngwaf_rule_request_logging').val()

                let actionType = ruleForm.find('#fastly_ngwaf_rule_action_field').val();

                if (actionType === 'deception') {

                    actions.push({
                        'type': actionType,
                        'deception_type': ruleForm.find('#fastly_ngwaf_rule_action_value').val()
                    })

                } else if (actionType === 'add_signal') {
                    actions.push({
                        'type': actionType,
                        'signal': ruleForm.find('#fastly_ngwaf_rule_action_value').val()
                    })
                } else {
                    actions.push({
                        'type': actionType,
                    })
                }

            } else if (ruleType === 'signal') {

                actions.push({
                    'signal': ruleForm.find('#fastly_ngwaf_rule_action_field').val(),
                    'type': ruleForm.find('#fastly_ngwaf_rule_action_value').val(),
                })

            } else if (ruleType === 'rate_limit') {

                let rateLimitActionMatch = ruleForm.find('#fastly_ngwaf_rule_rate_limit_action_match_type').val();
                let rateLimitFormType = ruleForm.find('#fastly_ngwaf_rule_rate_limit_action_field').val();

                if (rateLimitActionMatch === 'OTHER-SIGNAL') {

                    actions.push({
                        'type': rateLimitFormType,
                        'signal': ruleForm.find('#fastly_ngwaf_rule_rate_limit_action_other_signal_type').val()
                    })

                } else if (rateLimitActionMatch === 'ALL-REQUESTS') {

                    actions.push({
                        'type': rateLimitFormType,
                        'signal': rateLimitActionMatch
                    })

                } else if (rateLimitActionMatch === 'RULE-CONDITION') {

                    actions.push({
                        'type': rateLimitFormType,
                        'signal': ruleForm.find('#fastly_ngwaf_rule_rate_limit_threshold_signal').val()
                    })
                }

                let clientIdentifierKey = ruleForm.find('#fastly_ngwaf_rule_rate_limit_client_identifier').val()
                let clientIdentifiers = [];

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
                    'rule_payload': payload
                },
                showLoader: true,

                success: function (response) {

                    if ( (response.status ?? false) === false) {
                        let errorMessage = response.msg ?? 'Error while updating custom rule';

                        errorMessageDivRuleEdit.show()
                        errorMessageDivRuleEdit.html('')
                        errorMessageDivRuleEdit.html(errorMessage)
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
                    errorMessageDivRuleEdit.html('')
                    errorMessageDivRuleEdit.html('Something went wrong while updating the rule, please try again')
                }
            })

        }

        function populateFormOptions() {

            // NGWAF creation/edit rule form
            let ruleTypeSelectElement = $('#fastly_ngwaf_rule_type');

            let ruleActionsElement = $('#fastly_ngwaf_rule_action_field');
            let ruleActionsValueBlock = $('.fastly_ngwaf_rule_action_value_block');
            let ruleActionsValueElement = $('#fastly_ngwaf_rule_action_value');

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

            $(document).off("click", '.ngwaf-fastly-delete-rule-condition-action')
                .on("click", '.ngwaf-fastly-delete-rule-condition-action', function() {

                deleteCondition($(this).parents('.ngwaf-condition'));
            })

            $(document).off("click", '.ngwaf-fastly-delete-multival-rule-condition-action')
                .on("click", '.ngwaf-fastly-delete-multival-rule-condition-action', function() {

                deleteCondition($(this).parent('.ngwaf-condition'));
            })


            $(document).off("click", '.ngwaf-fastly-delete-condition-group-action')
                .on("click", '.ngwaf-fastly-delete-condition-group-action', function() {

                deleteCondition($(this).parents('.ngwaf-condition-group'));
            })

            $(document).off("click", '.ngwaf-fastly-add-multival-rule-condition-action')
                .on("click", '.ngwaf-fastly-add-multival-rule-condition-action', function () {

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

                let numberOfConditions;

                $(this).siblings('.ngwaf-multival-conditions').append(elementToInsert);
                numberOfConditions = $(this).siblings('.ngwaf-multival-conditions').children('.ngwaf-condition').length || 0;

                let currentConditionType = $(this).parents('.ngwaf-condition').find("select[name='fastly_ngwaf_rule_condition_field[]']").val();
                let multivalOptions = config.rulePayload?.conditions[currentConditionType]?.multival_options ?? []


                let newRuleConditionField = elementToInsert.find(".fastly_ngwaf_multival_rule_condition_field");
                initializeRuleConditionField(newRuleConditionField, true, multivalOptions);

                if (numberOfConditions >= 10) {
                    $(this).prop('disabled', true);
                    $(this).siblings('.ngwaf-fastly-add-rule-condition-group-action').prop('disabled', true);
                }

            })

            $(document).off("click", '.ngwaf-fastly-add-rule-condition-action')
                .on("click", '.ngwaf-fastly-add-rule-condition-action',function () {

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

                let numberOfConditions;


                if ($(this).siblings('.ngwaf-condition, .ngwaf-condition-group').last().length) {

                    $(this).siblings('.ngwaf-condition, .ngwaf-condition-group').last().after(elementToInsert);
                    numberOfConditions = $(this).siblings('.ngwaf-condition, .ngwaf-condition-group').length || 0;

                } else if ($(this).siblings('.ngwaf-group-conditions').length) {

                    $(this).siblings('.ngwaf-group-conditions').append(elementToInsert);
                    numberOfConditions = $(this).siblings('.ngwaf-group-conditions').children('.ngwaf-condition').length || 0;

                } else {

                    $(this).parent().prepend(elementToInsert);
                    numberOfConditions = $(this).siblings('.ngwaf-condition, .ngwaf-condition-group').length || 0;
                }

                let newRuleConditionField = elementToInsert.find(".fastly_ngwaf_rule_condition_field");
                initializeRuleConditionField(newRuleConditionField);

                if (numberOfConditions >= 10) {
                    $(this).prop('disabled', true);
                    $(this).siblings('.ngwaf-fastly-add-rule-condition-group-action').prop('disabled', true);
                }

            })

            $(document).off("click", '.ngwaf-fastly-add-rule-condition-group-action')
                .on("click", '.ngwaf-fastly-add-rule-condition-group-action',function () {

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


                if ($(this).siblings('.ngwaf-condition').last().length) {
                    $(this).siblings('.ngwaf-condition').last().after(elementToInsert);
                } else {
                    $(this).parent().prepend(elementToInsert);
                }

                let newRuleConditionField = elementToInsert.find(".fastly_ngwaf_rule_condition_field");
                initializeRuleConditionField(newRuleConditionField);

                let numberOfConditions = $(this).siblings('.ngwaf-condition, .ngwaf-condition-group').length || 0;

                if (numberOfConditions >= 10) {
                    $(this).prop('disabled', true);
                    $(this).siblings('.ngwaf-fastly-add-rule-condition-action').prop('disabled', true);
                }

            })

            ruleActionsElement.on("change", function() {

                let selectedRuleType = ruleTypeSelectElement.val();
                let selectedActionType = $(this).val();

                let optionsForAction = config.rulePayload?.actions[selectedRuleType][selectedActionType]?.options ?? [];

                if (typeof optionsForAction === 'string') {
                    optionsForAction = selectOptions?.[optionsForAction] ?? [];
                }

                if (!optionsForAction.length) {
                    ruleActionsValueBlock.hide()
                    ruleActionsValueElement.empty().hide()
                } else {

                    ruleActionsValueElement.empty()

                    $.each(optionsForAction, function(key, value) {

                        ruleActionsValueElement.append(
                            $(`<option value='${value.id}' >${value.display_name}</option>"`)
                        );
                    });

                    ruleActionsValueBlock.show()
                    ruleActionsValueElement.show()

                }
            })

            rateLimitActionsMatchType.on("change", function() {
                let hasOptions = $(this).find(':selected').data('has-options');

                if (hasOptions) {
                    $(this).parents('.rate-limit-action-value-selection').find('.rate-limit-action-value-option').show()
                } else {
                    $(this).parents('.rate-limit-action-value-selection').find('.rate-limit-action-value-option').hide()
                }
            })

            rateLimitActionsElement.on("change", function() {

                let selectedRuleType = ruleTypeSelectElement.val();
                let selectedActionType = $(this).val();

                let optionsForAction = config.rulePayload?.actions[selectedRuleType][selectedActionType]?.options ?? [];


                if (typeof optionsForAction === 'string') {
                    optionsForAction = selectOptions?.[optionsForAction] ?? [];
                }


                if (!optionsForAction.length) {
                    rateLimitActionsValueElement.empty().hide()
                } else {

                    rateLimitActionsValueElement.empty()

                    $.each(optionsForAction, function(key, value) {

                        rateLimitActionsValueElement.append(
                            $(`<option value='${value.id}' >${value.display_name}</option>"`)
                        );
                    });

                    rateLimitActionsValueElement.show()

                }
            })

            ruleTypeSelectElement.on("change", function() {
                let selectedValue = $(this).val();
                let actionsElement;

                if (selectedValue === 'rate_limit') {
                    ruleActionsSection.hide();
                    rateLimitActionsSection.show();
                    rateLimitDetailsSection.show();

                    if(!rateLimitThresholdSignal.find('option').length) {

                        let options = selectOptions?.['custom_signal_options'] ?? [];

                        $.each(options, function(key, value) {
                            rateLimitThresholdSignal.append(
                                $(`<option value='${value.id}'>${value.display_name}</option>"`)
                            );
                        });

                    }

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

            $(document).off("change", '.fastly_ngwaf_multival_rule_condition_operator')
                .on("change", '.fastly_ngwaf_multival_rule_condition_operator',function() {

                let selectedValue = $(this).val();

                let currentConditionType = $(this).parents('.ngwaf-condition').find("select[name='fastly_ngwaf_multival_rule_condition_field[]']").val();
                let selectOptionValues = config.rulePayload?.multival_parameters[currentConditionType]?.options ?? '';

                let conditionInputValue = $(this).closest('.ngwaf-condition').find("input[name='fastly_ngwaf_multival_rule_condition_value[]']")
                let conditionInputSelect = $(this).closest('.ngwaf-condition').find("select[name='fastly_ngwaf_multival_rule_condition_value[]']")

                if (selectedValue === 'in_list' || selectedValue === 'not_in_list') {

                    selectOptionValues = selectOptions?.[selectOptionValues] ?? [];
                    conditionInputValue.empty().hide()
                    conditionInputSelect.empty()

                    $.each(selectOptionValues, function(key, value) {
                        conditionInputSelect.append(
                            $(`<option value='${value.reference_id}' >${value.name}</option>"`)
                        );
                    });

                    conditionInputSelect.show()

                } else {

                    let selectOptionValues = []; // no select options in multival fields
                    toggleInputElementForRuleValue(currentConditionType, conditionInputValue, conditionInputSelect, selectOptionValues)
                }

            })

            $(document).off("change", '.fastly_ngwaf_rule_condition_operator')
                .on("change", '.fastly_ngwaf_rule_condition_operator',function() {

                let selectedValue = $(this).val();

                let currentConditionType = $(this).parents('.ngwaf-condition').find("select[name='fastly_ngwaf_rule_condition_field[]']").val();
                let selectOptionValues = config.rulePayload?.conditions[currentConditionType]?.options ?? '';
                let conditionValueSection = $(this).parents('.ngwaf-condition').find(".ngwaf-condition-value-section")
                let conditionInputValue = $(this).parents('.ngwaf-condition').find("input[name='fastly_ngwaf_rule_condition_value[]']")
                let conditionInputSelect = $(this).parents('.ngwaf-condition').find("select[name='fastly_ngwaf_rule_condition_value[]']")

                if (selectedValue === 'in_list' || selectedValue === 'not_in_list') {

                    conditionValueSection.show()
                    selectOptionValues = selectOptions?.[selectOptionValues] ?? [];
                    $(this).parents('.ngwaf-condition').find(".ngwaf-condition-multival").remove()
                    conditionInputValue.empty().hide()
                    conditionInputSelect.empty()

                    $.each(selectOptionValues, function(key, value) {
                        conditionInputSelect.append(
                            $(`<option value='${value.reference_id}' >${value.name}</option>"`)
                        );
                    });

                    conditionInputSelect.show()

                } else if (selectedValue === 'exists' || selectedValue === 'does_not_exist') {

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
                        $(`<option value='${key}' >${value}</option>"`)
                    );
                });

                let selectOptionValues = config.rulePayload?.conditions[selectedValue]?.multival_options ?? []
                toggleInputElementForRuleValue(selectedValue, conditionInputValue, conditionInputSelect, selectOptionValues);

                ruleConditionOperator.trigger('change')

            });

            $(document).off("change", '.fastly_ngwaf_rule_condition_field')
                .on("change", '.fastly_ngwaf_rule_condition_field',function() {

                let selectedValue = $(this).val();
                let conditionInputValue = $(this).parents('.ngwaf-condition').find("input[name='fastly_ngwaf_rule_condition_value[]']")
                let conditionInputSelect = $(this).parents('.ngwaf-condition').find("select[name='fastly_ngwaf_rule_condition_value[]']")
                let multivalElement = $(this).parents('.ngwaf-condition').find(".ngwaf-condition-multival");

                let conditionOptions = config.rulePayload?.conditions[selectedValue]?.conditions ?? [];

                let ruleConditionOperator = $(this).parents('.ngwaf-condition').find("select[name='fastly_ngwaf_rule_condition_operator[]']")
                ruleConditionOperator.empty()
                $.each(conditionOptions, function(key, value) {
                    ruleConditionOperator.append(
                        $(`<option value='${key}' >${value}</option>"`)
                    );
                });

                if ($(this).parents('.ngwaf-multival-conditions').length) {

                    let originalConditionValue = $(this).parents('.ngwaf-condition-multival').
                    parent('.ngwaf-condition').
                    find('.fastly_ngwaf_rule_condition_field:first').val()

                    let conditionMultivalOptions = config.rulePayload?.conditions[originalConditionValue]?.multival_options ?? []
                    displayMultivalForm($(this).parents('.ngwaf-condition'), conditionMultivalOptions)
                } else if (conditionOptions['exists'] || conditionOptions['does_not_exist']) {

                    multivalElement.remove()
                    let conditionMultivalOptions = config.rulePayload?.conditions[selectedValue]?.multival_options ?? []
                    displayMultivalForm($(this).parents('.ngwaf-condition'), conditionMultivalOptions)

                } else  {

                    multivalElement.remove()
                    $(this).parents('.ngwaf-condition').find(".ngwaf-condition-value-section").show()
                    let selectOptionValues = config.rulePayload?.conditions[selectedValue]?.select_options ?? []
                    toggleInputElementForRuleValue(selectedValue, conditionInputValue, conditionInputSelect, selectOptionValues);
                }
            });

            rateLimitClientIdentifier.on("change", function() {

                let selectedValue = $(this).val();

                let inputValueElement = $(this).parents('.fastly-ngwaf-rule-rate-limit-details')
                    .find("input[name='fastly_ngwaf_rule_rate_limit_client_identifier_input_value']")

                let selectValueElement = $(this).parents('.fastly-ngwaf-rule-rate-limit-details')
                    .find("select[name='fastly_ngwaf_rule_rate_limit_client_identifier_select_value']")

                let clientIdentifier = config.rulePayload?.rate_limit_identifiers[selectedValue] ?? [];

                if (!clientIdentifier.has_value) {
                    rateLimitClientIdentifierValueBlock.hide();
                } else if (!clientIdentifier.options) {
                    rateLimitClientIdentifierValueBlock.show()
                    inputValueElement.empty().show()
                    selectValueElement.empty().hide()
                } else if (typeof clientIdentifier.options === 'string') {

                    rateLimitClientIdentifierValueBlock.show()
                    inputValueElement.empty().hide()

                    let options = selectOptions?.[clientIdentifier.options] ?? [];
                    selectValueElement.empty()

                    $.each(options, function(key, value) {
                        selectValueElement.append(
                            $(`<option value='${value.id}'>${value.display_name}</option>"`)
                        );
                    });

                    selectValueElement.show()
                }
            })

            if (ruleTypeSelectElement && config.rulePayload?.rule_types) {

                ruleTypeSelectElement.empty()
                $.each(config.rulePayload.rule_types, function(key, value) {
                    ruleTypeSelectElement.append(
                        $(`<option value='${key}'>${value}</option>"`)
                    );
                });

                ruleTypeSelectElement.trigger('change')
            }

            let ruleConditionField = $('.fastly_ngwaf_rule_condition_field')
            initializeRuleConditionField(ruleConditionField);

            if (rateLimitClientIdentifier && config.rulePayload?.rate_limit_identifiers) {
                rateLimitClientIdentifier.empty()

                $.each(config.rulePayload?.rate_limit_identifiers, function(key, value) {
                    rateLimitClientIdentifier.append(
                        $(`<option value='${key}' data-rate-lmit-identifier-type="${value.input_parameter_name}">${value.name}</option>"`)
                    );
                });

                rateLimitClientIdentifier.trigger('change')
            }
        }

        function initializeRuleConditionField(ruleConditionField, isMultival = false, multivalOptions = []) {

            if (ruleConditionField && !isMultival && config.rulePayload?.conditions) {
                ruleConditionField.empty()
                $.each(config.rulePayload.conditions, function(key, value) {
                    ruleConditionField.append(
                        $(`<option value='${key}' data-rule-condition-type="${value.type}">${value.name}</option>"`)
                    );
                });

            } else if (ruleConditionField && isMultival && config.rulePayload?.multival_parameters) {

                ruleConditionField.empty()
                let multivalConfig;

                $.each(multivalOptions, function(key, value) {

                    multivalConfig = config.rulePayload?.multival_parameters[value] ?? null;

                    if (!multivalConfig) {
                        return true; // skip this iteration
                    }

                    ruleConditionField.append(
                        $(`<option value='${value}' data-rule-condition-type="${multivalConfig.type}">${multivalConfig.name}</option>"`)
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

            currentCondition.remove()
            addConditionButton.prop('disabled', false);
            addConditionMultivalButton.prop('disabled', false);
            addConditionGroupButton.prop('disabled', false);
            addConditionInGroupButton.prop('disabled', false);
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

            parentElement.find(".ngwaf-condition-value-section").hide()

            if (!parentElement.find('.ngwaf-condition-multival').length) {
                parentElement.append(elementToInsert)
            }

            let newRuleConditionField = elementToInsert.find(".fastly_ngwaf_multival_rule_condition_field");
            initializeRuleConditionField(newRuleConditionField, true, conditionMultivalOptions);

        }

        function toggleInputElementForRuleValue(selectedValue, conditionInputValue, conditionInputSelect, selectOptionValues) {

            if (!selectOptionValues || !Object.keys(selectOptionValues).length) {
                conditionInputValue.empty().show()
                conditionInputSelect.empty().hide()
            } else {
                conditionInputValue.empty().hide()

                conditionInputSelect.empty()

                $.each(selectOptionValues, function (key, value) {
                    conditionInputSelect.append(
                        $(`<option value='${key}' >${value}</option>"`)
                    );
                });

                conditionInputSelect.show()

            }
        }

        function populateSelectFieldOptions() {

            if (selectOptions === undefined) {

                $.ajax({
                    type: 'GET',
                    url: config.ruleSelectOptionsUrl,
                    showLoader: false,
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
