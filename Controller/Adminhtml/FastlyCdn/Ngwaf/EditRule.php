<?php

namespace Fastly\Cdn\Controller\Adminhtml\FastlyCdn\Ngwaf;

use Fastly\Cdn\Model\Api;
use Magento\Backend\App\Action;
use Magento\Backend\App\Action\Context;
use Magento\Framework\Controller\Result\JsonFactory;

class EditRule extends Action
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

    private $payloadParameters = [
        'conditions',
        'actions',
        'type',
        'enabled',
        'description',
        'group_operator',
        'request_logging',
        'rate_limit'
    ];


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

        $ruleId = $this->getRequest()->getParam('rule_id');
        $workspaceId = $this->getRequest()->getParam('workspace_id', '');
        $rulePayload = $this->getRequest()->getParam('rule_payload');

        if (empty($rulePayload['conditions'])) {
            return $result->setData([
                'status' => false,
                'msg' => 'Rule Conditions are missing.',
            ]);
        }

        if (empty($rulePayload['actions'])) {
            return $result->setData([
                'status' => false,
                'msg' => 'Rule Actions are missing.',
            ]);
        }

        if (empty($rulePayload['type'])) {
            return $result->setData([
                'status' => false,
                'msg' => 'Rule type is missing.',
            ]);
        }

        if (!isset($rulePayload['enabled'])) {
            return $result->setData([
                'status' => false,
                'msg' => 'Rule enabled status is missing.',
            ]);
        }

        if (empty($rulePayload['description'])) {
            return $result->setData([
                'status' => false,
                'msg' => 'Rule description is missing.',
            ]);
        }

        if (empty($rulePayload['group_operator'])) {
            return $result->setData([
                'status' => false,
                'msg' => 'Rule group operator is missing.',
            ]);
        }

        $rulePayload['enabled'] = $rulePayload['enabled'] === 'true'; // need to cast to bool for API call

        if (isset($rulePayload['rate_limit']['threshold'])) {
            $rulePayload['rate_limit']['threshold'] = (int) $rulePayload['rate_limit']['threshold'];
        }

        if (isset($rulePayload['rate_limit']['interval'])) {
            $rulePayload['rate_limit']['interval'] = (int) $rulePayload['rate_limit']['interval'];
        }

        if (isset($rulePayload['rate_limit']['duration'])) {
            $rulePayload['rate_limit']['duration'] = (int) $rulePayload['rate_limit']['duration'];
        }

        $sanitizedPayload = [];

        foreach ($this->payloadParameters as $parameter) {

            if (isset($rulePayload[$parameter])) {
                $sanitizedPayload[$parameter] = $rulePayload[$parameter];
            }
        }

        try {
            $response = $this->api->createRule($workspaceId, $sanitizedPayload, $ruleId);

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

