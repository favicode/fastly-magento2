<?php

namespace Fastly\Cdn\Controller\Adminhtml\FastlyCdn\Ngwaf;

use Fastly\Cdn\Model\Api;
use Magento\Backend\App\Action;
use Magento\Backend\App\Action\Context;
use Magento\Framework\Controller\Result\JsonFactory;

class EditAttackSignalThresholds extends Action
{
    const ADMIN_RESOURCE = 'Magento_Backend::cache';

    /**
     * @var JsonFactory
     */
    private $resultJsonFactory;

    /**
     * @var Api
     */
    private $api;

    public function __construct(
        Context $context,
        JsonFactory $resultJsonFactory,
        Api $api
    ) {
        parent::__construct($context);

        $this->api = $api;
        $this->resultJsonFactory = $resultJsonFactory;
    }


    public function execute()
    {
        $result = $this->resultJsonFactory->create();

        // Adjust parameters to expected types - null for empty, integer for other values
        if (empty($this->getRequest()->getParam('one_hour'))) {
            $oneHourLimit = null;
        } else {
            $oneHourLimit = (int)$this->getRequest()->getParam('one_hour');
        }

        if (empty($this->getRequest()->getParam('one_minute'))) {
            $oneMinuteLimit = null;
        } else {
            $oneMinuteLimit = (int)$this->getRequest()->getParam('one_minute');
        }

        if (empty($this->getRequest()->getParam('ten_minutes'))) {
            $tenMinutesLimit = null;
        } else {
            $tenMinutesLimit = (int)$this->getRequest()->getParam('ten_minutes');
        }

        $payload = [
            'attack_signal_thresholds' => [
                'immediate' => $this->getRequest()->getParam('immediate', false) === 'true',
                'one_hour' => $oneHourLimit,
                'one_minute' => $oneMinuteLimit,
                'ten_minutes' => $tenMinutesLimit
            ]
        ];

        try {
            $response = $this->api->editThresholds($this->getRequest()->getParam('workspace_id', ''), $payload);

            return $result->setData([
                'status' => $response
            ]);

        } catch (\Throwable $e) {
            return $result->setData([
                'status' => false,
                'msg' => $e->getMessage(),
            ]);
        }
    }
}
