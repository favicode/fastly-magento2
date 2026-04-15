define([
    'jquery',
    'mage/template',
    'Magento_Ui/js/modal/modal'
], function ($, template, modal) {

    return function (config) {

        let ngWafHead = $('#system_full_page_cache_fastly_fastly_next_gen_waf-head');
        let noWorkspaceListsFoundMessage = $('#ngwaf-no-workspace-lists');
        let loader = $('#ngwaf-loading-workspace-lists');
        let workspaceListTableRows = $('#fastly-workspace-lists-list');
        let errorMessageDiv = $('#fastly-error-ngwaf-workspace-list');
        let successMessageDiv = $('#fastly-success-ngwaf-workspace-list');
        let workspaceListModal = $('#fastly-workspace-list-modal-content');
        let newWorkspaceListButton = $('#fastly_ngwaf_workspace_list_create_button');


        ngWafHead.one('click', function () {
            fetchWorkspaceLists();
        });

        newWorkspaceListButton.on('click', function () {
            createWorkspaceListModal();
        })

        function fetchWorkspaceLists() {

            $.ajax({
                type: 'GET',
                url: config.getAllWorkspaceListsUrl,
                showLoader: false,
                success: function (response) {


                    if ( (response.status ?? false) === false) {

                        let errorMessage = response.msg ?? 'Error while fetching workspace lists';
                        displayError(errorMessage);

                    }  else {

                        errorMessageDiv.hide()

                        let workspaceLists = response.workspaceLists ?? null;
                        if (!workspaceLists || !workspaceLists.length) {
                            loader.hide()
                            noWorkspaceListsFoundMessage.show()
                            return;
                        }

                        renderWorkspaceLists(workspaceLists);


                    }

                },
                error: function (request, error) {

                    displayError("Something went wrong while fetching workspace lists");
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

        function renderWorkspaceLists(workspaceLists) {
            loader.hide()

            let html = '';

            $.each(workspaceLists, function (index, workspaceList) {

                html += template(
                    `<tr id='fastly_<%- workspaceListId %>"'>
                            <td>
                                <input data-workspaceListId="<%- workspaceListId %>" id='workspace_list_<%- workspaceListId %>' value="<%- workspaceListName %>" disabled='disabled' class='input-text' type='text'>
                            </td>
                            <td>
                                <input data-workspaceListId="<%- workspaceListId %>" id='workspace_list_<%- workspaceListId %>' value="<%- workspaceListType %>" disabled='disabled' class='input-text' type='text'>
                            </td>
                            <td class='col-actions'>
                                <button class='action-delete fastly-edit-snippet-icon fastly-edit-workspace-list-action'
                                data-workspace-list-id="<%- workspaceListId %>"
                                data-workspace-list-name="<%- workspaceListName %>"
                                data-workspace-list-description="<%- workspaceListDescription %>"
                                data-workspace-list-entries="<%- workspaceListEntries %>"
                                data-workspace-list-type="<%- workspaceListType %>"
                                id='fastly_edit_workspace_list_<%- workspaceListId %>'
                                title='Edit workspace list' type='button'/>
                                <span>&nbsp;&nbsp;</span>
                                <button class='action-delete fastly-delete-snippet-icon fastly-delete-workspace-list-action' data-workspace-list-id="<%- workspaceListId %>" id='fastly_delete_workspace_list_<%- workspaceListId %>' title='Delete workspace list' type='button'/>
                            </td>
                         </tr>`,
                    {
                        workspaceListName: workspaceList.name,
                        workspaceListDescription: workspaceList.description,
                        workspaceListType: workspaceList.type,
                        workspaceListEntries: workspaceList.entries.join("\n"),
                        workspaceListId: workspaceList.id,
                    }
                );
            });

            workspaceListTableRows.html(html);

        }

        $('body').on('click', 'button.fastly-delete-workspace-list-action', function () {

            let workspaceListId = $(this).data('workspace-list-id');
            let workspaceListRow = $(this).closest('tr');

            let deleteWorkspaceListOptions = {
                type: 'slide',
                responsive: true,
                innerScroll: true,
                title: jQuery.mage.__('You are about to delete a Custom Workspace List'),
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
                        deleteWorkspaceList(workspaceListId, workspaceListRow);
                    }
                }]
            };

            workspaceListModal.html('');
            modal(deleteWorkspaceListOptions, workspaceListModal);
            workspaceListModal.modal('openModal');

        });

        function deleteWorkspaceList(workspaceListId, workspaceListRow) {

            $.ajax({
                type: 'POST',
                url: config.deleteWorkspaceListUrl,
                data: {
                    'workspace_list_id': workspaceListId
                },
                showLoader: true,

                success: function (response) {

                    if ( (response.status ?? false) === false) {
                        let errorMessage = response.msg ?? 'Error while deleting a workspace list';
                        displayError(errorMessage);
                        successMessageDiv.hide();
                    }  else {
                        errorMessageDiv.hide()
                        workspaceListRow.remove();
                        displaySuccess('Workspace list deleted successfully');
                    }

                },
                error: function (request, error) {

                    displayError("Something went wrong while deleting the workspace list, please try again");
                }
            })

            workspaceListModal.modal('closeModal');

        }

        $('body').on('click', 'button.fastly-edit-workspace-list-action', function () {

            let workspaceListId = $(this).data('workspace-list-id');
            let workspaceListName = $(this).data('workspace-list-name');
            let workspaceListDescription = $(this).data('workspace-list-description');
            let workspaceListEntries = $(this).data('workspace-list-entries');
            let workspaceListType = $(this).data('workspace-list-type');

            createWorkspaceListModal(workspaceListId, workspaceListName, workspaceListDescription, workspaceListEntries, workspaceListType)

        });

        function createWorkspaceListModal(
            workspaceListId = null,
            workspaceListName = null,
            workspaceListDescription = null,
            workspaceListEntries = null,
            workspaceListType = null
        ) {

            let title = workspaceListId === null ? 'Create Workspace List' : 'Edit Workspace List';
            let buttonText = workspaceListId === null ? 'Create' : 'Update';

            let createWorkspaceListOptions = {
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
                        createWorkspaceList(workspaceListId);
                    }
                }]
            };

            workspaceListModal.html($('#fastly-custom-workspace-list-template').text());
            modal(createWorkspaceListOptions, workspaceListModal);

            if (workspaceListName) {
                $('#workspace_list_name').val(workspaceListName);
                // Name can't be updated so we just display it
                $('#workspace_list_name').prop('disabled', true);
            }

            if (workspaceListType) {
                $('#workspace_list_type').val(workspaceListType);
                // Type can't be updated so we just display it
                $('#workspace_list_type').prop('disabled', true);
            }

            if (workspaceListDescription) {
                $('#workspace_list_description').val(workspaceListDescription);
            }

            if (workspaceListEntries) {
                $('#workspace_list_entries').val(workspaceListEntries);
            }

            workspaceListModal.modal('openModal');
        }

        function createWorkspaceList(workspaceListId = null) {

            let workspaceListName = $('#workspace_list_name').val();
            let workspaceListDescription = $('#workspace_list_description').val();
            let workspaceListType = $('#workspace_list_type').val();
            let workspaceListEntries = $('#workspace_list_entries').val();

            $.ajax({
                type: 'POST',
                url: config.editWorkspaceListUrl,
                data: {
                    'workspace_list_id': workspaceListId,
                    'workspace_list_name': workspaceListName,
                    'workspace_list_description': workspaceListDescription,
                    'workspace_list_type': workspaceListType,
                    'workspace_list_entries': workspaceListEntries,
                },
                showLoader: true,

                success: function (response) {

                    if ( (response.status ?? false) === false) {
                        let errorMessage = response.msg ?? 'Error while updating custom workspace list';
                        displayError(errorMessage);
                        successMessageDiv.hide()
                    }  else {
                        errorMessageDiv.hide()
                        fetchWorkspaceLists()
                        displaySuccess('Custom workspace list updated')

                    }

                },
                error: function (request, error) {
                    displayError("Something went wrong while updating the workspace list, please try again");
                }
            })

            workspaceListModal.modal('closeModal');
        }
    }
});

