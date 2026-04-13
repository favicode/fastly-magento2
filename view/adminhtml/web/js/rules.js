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


        ngWafHead.one('click', function () {
            fetchRules();
        });

        newRuleButton.on('click', function () {
            createRuleModal();
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
    }
});
