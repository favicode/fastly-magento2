define([
    'jquery',
    'mage/template',
    'Magento_Ui/js/modal/modal'
], function ($, template, modal) {

    return function (config) {

        let ngWafHead = $('#system_full_page_cache_fastly_fastly_next_gen_waf-head');
        let noSignalsFoundMessage = $('#ngwaf-no-signals');
        let loader = $('#ngwaf-loading-signals');
        let signalTableRows = $('#fastly-signals-list');
        let errorMessageDiv = $('#fastly-error-ngwaf-signal');
        let successMessageDiv = $('#fastly-success-ngwaf-signal');
        let signalModal = $('#fastly-signal-modal-content');
        let newSignalButton = $('#fastly_ngwaf_signal_create_button');
        let workspaceIdElement = $('#system_full_page_cache_fastly_fastly_next_gen_waf_fastly_next_gen_waf_workspace_id');


        ngWafHead.one('click', function () {
            fetchSignals();
        });

        workspaceIdElement.on('change', function () {
            fetchSignals()
        })

        newSignalButton.on('click', function () {
            createSignalModal();
        })

        function fetchSignals() {

            $.ajax({
                type: 'GET',
                url: config.getAllSignalsUrl,
                data: {
                    'workspace_id' : workspaceIdElement.val()
                },
                showLoader: false,
                success: function (response) {


                    if ( (response.status ?? false) === false) {

                        let errorMessage = response.msg ?? 'Error while fetching signals';
                        displayError(errorMessage);

                    }  else {

                        errorMessageDiv.hide()
                        noSignalsFoundMessage.hide()

                        let signals = response.signals ?? null;
                        if (!signals || !signals.length) {
                            signals = [];
                            loader.hide()
                            noSignalsFoundMessage.show()
                        }

                        renderSignalList(signals);


                    }

                },
                error: function (request, error) {

                    displayError("Something went wrong while fetching signals");
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

        function renderSignalList(signals) {
            loader.hide()

            let html = '';

            $.each(signals, function (index, signal) {
                html += template(
                    `<tr id='fastly_<%- signalId %>"'>
                            <td>
                                <input data-signalId="<%- signalId %>" id='signal_<%- signalId %>' value="<%- signalName %>" disabled='disabled' class='input-text' type='text'>
                            </td>
                            <td class='col-actions'>
                                <button class='action-delete fastly-edit-snippet-icon fastly-edit-signal-action' data-signal-id="<%- signalId %>" data-signal-name="<%- signalName %>" data-signal-description="<%- signalDescription %>" id='fastly_edit_signal_<%- signalId %>' title='Edit signal' type='button'/>
                                <span>&nbsp;&nbsp;</span>
                                <button class='action-delete fastly-delete-snippet-icon fastly-delete-signal-action' data-signal-id="<%- signalId %>" id='fastly_delete_signal_<%- signalId %>' title='Delete signal' type='button'/>
                            </td>
                         </tr>`,
                    {
                        signalName: signal.name,
                        signalDescription: signal.description,
                        signalId: signal.id,
                    }
                );
            });

            signalTableRows.html(html);

        }

        $('body').on('click', 'button.fastly-delete-signal-action', function () {

            let signalId = $(this).data('signal-id');
            let signalRow = $(this).closest('tr');

            let deleteSignalOptions = {
                type: 'slide',
                responsive: true,
                innerScroll: true,
                title: jQuery.mage.__('You are about to delete a Custom Signal'),
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
                        deleteSignal(signalId, signalRow);
                    }
                }]
            };

            signalModal.html('');
            modal(deleteSignalOptions, signalModal);
            signalModal.modal('openModal');

        });

        function deleteSignal(signalId, signalRow) {

            $.ajax({
                type: 'POST',
                url: config.deleteSignalUrl,
                data: {
                    'signal_id': signalId,
                    'workspace_id': workspaceIdElement.val()
                },
                showLoader: true,

                success: function (response) {

                    if ( (response.status ?? false) === false) {
                        let errorMessage = response.msg ?? 'Error while deleting a signal';
                        displayError(errorMessage);
                        successMessageDiv.hide();
                    }  else {
                        errorMessageDiv.hide()
                        signalRow.remove();
                        displaySuccess('Signal deleted successfully');
                    }

                },
                error: function (request, error) {

                    displayError("Something went wrong while deleting the signal, please try again");
                }
            })

            signalModal.modal('closeModal');

        }

        $('body').on('click', 'button.fastly-edit-signal-action', function () {

            let signalId = $(this).data('signal-id');
            let signalName = $(this).data('signal-name');
            let signalDescription = $(this).data('signal-description');

            createSignalModal(signalId, signalName, signalDescription)

        });

        function createSignalModal(signalId = null, signalName = null, signalDescription = null) {

            let title = signalId === null ? 'Create Signal' : 'Edit Signal';
            let buttonText = signalId === null ? 'Create' : 'Update';

            let createSignalOptions = {
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
                        createSignal(signalId);
                    }
                }]
            };

            signalModal.html($('#fastly-custom-signal-template').text());
            modal(createSignalOptions, signalModal);

            if (signalName) {
                $('#custom_signal_name').val(signalName);
                // Name can't be updated so we just display it
                $('#custom_signal_name').prop('disabled', true);
            }

            if (signalDescription) {
                $('#custom_signal_description').val(signalDescription);
            }

            signalModal.modal('openModal');
        }

        function createSignal(signalId = null) {

            let signalName = $('#custom_signal_name').val();
            let signalDescription = $('#custom_signal_description').val();

            $.ajax({
                type: 'POST',
                url: config.editSignalUrl,
                data: {
                    'signal_id': signalId,
                    'signal_name': signalName,
                    'signal_description': signalDescription,
                    'workspace_id': workspaceIdElement.val()
                },
                showLoader: true,

                success: function (response) {

                    if ( (response.status ?? false) === false) {
                        let errorMessage = response.msg ?? 'Error while updating custom signal';
                        displayError(errorMessage);
                        successMessageDiv.hide()
                    }  else {
                        errorMessageDiv.hide()
                        fetchSignals()
                        displaySuccess('Custom signal updated')

                    }

                },
                error: function (request, error) {
                    displayError("Something went wrong while updating the signal, please try again");
                }
            })

            signalModal.modal('closeModal');
        }
    }
});
