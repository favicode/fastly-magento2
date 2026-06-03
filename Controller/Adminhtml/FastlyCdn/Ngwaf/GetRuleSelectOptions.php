<?php

namespace Fastly\Cdn\Controller\Adminhtml\FastlyCdn\Ngwaf;

use Fastly\Cdn\Model\Api;
use Fastly\Cdn\Model\Ngwaf\RuleProvider;
use Magento\Backend\App\Action;
use Magento\Backend\App\Action\Context;
use Magento\Framework\Controller\Result\JsonFactory;

class GetRuleSelectOptions extends Action
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
    private RuleProvider $ruleProvider;


    public function __construct(
        Context $context,
        JsonFactory $resultJsonFactory,
        Api $api,
        RuleProvider $ruleProvider
    ) {
        parent::__construct($context);

        $this->api = $api;
        $this->resultJsonFactory = $resultJsonFactory;
        $this->ruleProvider = $ruleProvider;
    }


    public function execute()
    {
        $result = $this->resultJsonFactory->create();

        try {

            $options = $this->ruleProvider->getSelectOptions($this->_request->getParam('workspace_id', ''));

            return $result->setData([
                'status' => true,
                'options' => $options
            ]);

        } catch (\Throwable $e) {
            return $result->setData([
                'status' => false,
                'msg' => $e->getMessage(),
            ]);
        }
    }
}
