define([
    'jquery',
    'mage/template',
    'Magento_Ui/js/modal/modal'
], function ($, template, modal) {

    return function (config) {

        let errorMessageDiv = $('#fastly-error-ngwaf-attack-signal-thresholds');
        let successMessageDiv = $('#fastly-success-ngwaf-attack-signal-thresholds');
        let thresholdsModal = $('#fastly-attack-signal-tresholds-modal-content');
        let editThresholdButton = $('#fastly_ngwaf_attack_thresholds_edit_button');
        let workspaceIdElement = $('#system_full_page_cache_fastly_fastly_next_gen_waf_fastly_next_gen_waf_workspace_id');


        editThresholdButton.on('click', function () {
            createThresholdsModal();
        })

        function displayError(errorMessage) {
            errorMessageDiv.show()
            errorMessageDiv.html('')
            errorMessageDiv.html(errorMessage)
        }

        function displaySuccess(successMessage) {
            successMessageDiv.show()
            successMessageDiv.html('')
            successMessageDiv.html(successMessage)
        }

        function createThresholdsModal() {

            $.ajax({
                type: 'GET',
                url: config.getThresholdsUrl,
                data: {
                    'workspace_id': workspaceIdElement.val()
                },
                showLoader: true,
                success: function (response) {

                    if ( (response.status ?? false) === false) {

                        let errorMessage = response.msg ?? 'Error while fetching threshold data';
                        displayError(errorMessage);

                    }  else {

                        errorMessageDiv.hide()

                        let thresholds = response.thresholds ?? null;

                        let thresholdOptions = {
                            type: 'slide',
                            responsive: true,
                            innerScroll: true,
                            title: jQuery.mage.__('Update Threshold Values'),
                            buttons: [{
                                text: $.mage.__('Cancel'),
                                'class': 'action cancel',
                                click: function () {
                                    this.closeModal();
                                }
                            }, {
                                text: $.mage.__('Update'),
                                'class': 'action primary upload-button',
                                click: function () {
                                    updateThresholdData();
                                }
                            }]
                        };

                        thresholdsModal.html($('#fastly-attack-signal-thresholds-template').text());
                        modal(thresholdOptions, thresholdsModal);

                        if (thresholds?.['immediate']) {
                            $('#immediate_blocking').val(thresholds['immediate'].toString());
                        }

                        if (thresholds?.['one_hour']) {
                            $('#one_hour_interval_threshold').val(thresholds['one_hour']);
                        }

                        if (thresholds?.['one_minute']) {
                            $('#one_minute_interval_threshold').val(thresholds['one_minute']);
                        }

                        if (thresholds?.['ten_minutes']) {
                            $('#ten_minute_interval_threshold').val(thresholds['ten_minutes']);
                        }


                        thresholdsModal.modal('openModal');

                    }

                },
                error: function (request, error) {

                    displayError("Something went wrong while fetching threshold data");
                }
            })

        }

        function updateThresholdData() {

            let immediateBlocking = $('#immediate_blocking').val();
            let oneHourThreshold = $('#one_hour_interval_threshold').val();
            let oneMinuteThreshold = $('#one_minute_interval_threshold').val();
            let tenMinuteThreshold = $('#ten_minute_interval_threshold').val();

            $.ajax({
                type: 'POST',
                url: config.editThresholdsUrl,
                data: {
                    'immediate': immediateBlocking,
                    'workspace_id': workspaceIdElement.val(),
                    'one_minute': oneMinuteThreshold,
                    'ten_minutes': tenMinuteThreshold,
                    'one_hour': oneHourThreshold
                },
                showLoader: true,

                success: function (response) {

                    if ( (response.status ?? false) === false) {
                        let errorMessage = response.msg ?? 'Error while updating attack signal thresholds';
                        displayError(errorMessage);
                        successMessageDiv.hide()
                    }  else {
                        errorMessageDiv.hide()
                        displaySuccess('Attack signal thresholds updated')

                    }

                },
                error: function (request, error) {
                    displayError("Something went wrong while updating the thresholds, please try again");
                }
            })

            thresholdsModal.modal('closeModal');
        }
    }
});
