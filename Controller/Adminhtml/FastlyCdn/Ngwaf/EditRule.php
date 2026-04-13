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
        $ruleName = $this->getRequest()->getParam('rule_name');
        $ruleDescription = $this->getRequest()->getParam('rule_description');

        if (empty($ruleName)) {
            return $result->setData([
                'status' => false,
                'msg' => 'Rule Name is missing.',
            ]);
        }

        if (empty($ruleDescription)) {
            return $result->setData([
                'status' => false,
                'msg' => 'Rule Description is missing.',
            ]);
        }

        try {
            $response = $this->api->createRule($ruleName, $ruleDescription, $ruleId);

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

