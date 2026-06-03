define([
    'jquery',
    'mage/template',
    'Magento_Ui/js/modal/modal'
], function ($, template, modal) {

    return function (config) {

        let ngWafHead = $('#system_full_page_cache_fastly_fastly_next_gen_waf-head');
        let noVirtualPatchesFoundMessage = $('#ngwaf-no-virtual-patches');
        let loader = $('#ngwaf-loading-virtual-patches');
        let virtualPatchTableRows = $('#fastly-virtual-patches-list');
        let errorMessageDiv = $('#fastly-error-ngwaf-virtual-patch');
        let successMessageDiv = $('#fastly-success-ngwaf-virtual-patch');
        let virtualPatchModal = $('#fastly-virtual-patch-modal-content');
        let workspaceIdElement = $('#system_full_page_cache_fastly_fastly_next_gen_waf_fastly_next_gen_waf_workspace_id');

        ngWafHead.one('click', function () {
            fetchVirtualPatches();
        });

        workspaceIdElement.on('change', function () {
            fetchVirtualPatches()
        })


        function fetchVirtualPatches() {

            $.ajax({
                type: 'GET',
                url: config.getAllVirtualPatchesUrl,
                data: {
                    'workspace_id': workspaceIdElement.val()
                },
                showLoader: false,
                success: function (response) {

                    if ( (response.status ?? false) === false) {

                        let errorMessage = response.msg ?? 'Error while fetching patches';
                        displayError(errorMessage);

                    }  else {

                        errorMessageDiv.hide()
                        noVirtualPatchesFoundMessage.hide()

                        let patches = response.patches ?? null;
                        if (!patches || !patches.length) {
                            patches = [];
                            loader.hide()
                            noVirtualPatchesFoundMessage.show()
                        }

                        renderVirtualPatchList(patches);

                    }

                },
                error: function (request, error) {
                    displayError("Something went wrong while fetching patches");
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

        function renderVirtualPatchList(patches) {
            loader.hide()

            let html = '';

            $.each(patches, function (index, virtualPatch) {
                html += template(
                    `<tr id='fastly_<%- virtualPatchId %>"'>
                            <td>
                                <input data-virtualPatchId="<%- virtualPatchId %>" id='virtual_patch_<%- virtualPatchId %>' value="<%- virtualPatchId %>" disabled='disabled' class='input-text' type='text'>
                            </td>
                            <td>
                                <input data-virtualPatchId="<%- virtualPatchId %>"
                                id='virtual_patch_<%- virtualPatchId %>'
                                value="<%- virtualPatchStatus %>" disabled='disabled' class='input-text' type='text'>
                            </td>
                            <td>
                                <input data-virtualPatchId="<%- virtualPatchId %>"
                                id='virtual_patch_<%- virtualPatchId %>'
                                value="<%- virtualPatchMode %>" disabled='disabled' class='input-text' type='text'>
                            </td>
                            <td class='col-actions'>
                                <button class='action-delete fastly-edit-snippet-icon fastly-edit-virtual-patch-action'
                                data-virtual-patch-id="<%- virtualPatchId %>"
                                data-virtual-patch-description="<%- virtualPatchDescription %>"
                                data-virtual-patch-mode="<%- virtualPatchMode %>"
                                data-virtual-patch-status="<%- virtualPatchStatus %>"
                                id='fastly_edit_virtual_patch_<%- virtualPatchId %>'
                                title='Edit patch' type='button'/>
                            </td>
                         </tr>`,
                    {
                        virtualPatchStatus: virtualPatch.enabled,
                        virtualPatchMode: virtualPatch.mode,
                        virtualPatchDescription: virtualPatch.description,
                        virtualPatchId: virtualPatch.id,
                    }
                );
            });

            virtualPatchTableRows.html(html);

        }

        $('body').on('click', 'button.fastly-edit-virtual-patch-action', function () {

            let virtualPatchId = $(this).data('virtual-patch-id');
            let virtualPatchDescription = $(this).data('virtual-patch-description');
            let virtualPatchMode = $(this).data('virtual-patch-mode');
            let virtualPatchStatus = $(this).data('virtual-patch-status');

            editVirtualPatchModal(virtualPatchId, virtualPatchDescription, virtualPatchMode, virtualPatchStatus);
        });

        function editVirtualPatchModal(virtualPatchId, virtualPatchDescription, virtualPatchMode, virtualPatchStatus) {

            let title = 'Edit Virtual Patch';
            let buttonText = 'Update';

            let editVirtualPatchOptions = {
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
                        editVirtualPatch(virtualPatchId);
                    }
                }]
            };

            virtualPatchModal.html($('#fastly-custom-virtual-patch-template').text());
            modal(editVirtualPatchOptions, virtualPatchModal);

            if (virtualPatchId) {
                $('#custom_virtual_patch_id').val(virtualPatchId);
                // Name can't be updated so we just display it
                $('#custom_virtual_patch_id').prop('disabled', true);
            }

            if (virtualPatchDescription) {
                $('#custom_virtual_patch_description').val(virtualPatchDescription);
                // Description can't be updated so we just display it
                $('#custom_virtual_patch_description').prop('disabled', true);
            }

            if (virtualPatchMode) {
                $('#custom_virtual_patch_mode').val(virtualPatchMode);
            }

            if (virtualPatchStatus) {
                $('#custom_virtual_patch_status').prop("checked", virtualPatchStatus);
            }

            virtualPatchModal.modal('openModal');
        }

        function editVirtualPatch(virtualPatchId) {

            let patchStatus = $('#custom_virtual_patch_status').is(':checked');
            let patchMode = $('#custom_virtual_patch_mode').val();

            $.ajax({
                type: 'POST',
                url: config.editVirtualPatchUrl,
                data: {
                    'patch_id': virtualPatchId,
                    'workspace_id': workspaceIdElement.val(),
                    'patch_status': patchStatus,
                    'patch_mode': patchMode
                },
                showLoader: true,

                success: function (response) {

                    if ( (response.status ?? false) === false) {
                        let errorMessage = response.msg ?? 'Error while updating virtual patch';
                        displayError(errorMessage);
                        successMessageDiv.hide()
                    }  else {
                        errorMessageDiv.hide()
                        fetchVirtualPatches()
                        displaySuccess('Virtual patch updated')

                    }

                },
                error: function (request, error) {
                    displayError("Something went wrong while updating the virtual patch, please try again");
                }
            })

            virtualPatchModal.modal('closeModal');
        }
    }
});
