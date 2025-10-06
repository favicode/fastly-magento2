<?php

namespace Fastly\Cdn\Controller\Adminhtml\FastlyCdn\Ngwaf;

use Fastly\Cdn\Model\Api;
use Magento\Backend\App\Action;
use Magento\Backend\App\Action\Context;
use Magento\Framework\Controller\Result\JsonFactory;

class EditSignal extends Action
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

        $signalId = $this->getRequest()->getParam('signal_id');
        $signalName = $this->getRequest()->getParam('signal_name');
        $signalDescription = $this->getRequest()->getParam('signal_description');

        if (empty($signalName)) {
            return $result->setData([
                'status' => false,
                'msg' => 'Signal Name is missing.',
            ]);
        }

        if (empty($signalDescription)) {
            return $result->setData([
                'status' => false,
                'msg' => 'Signal Description is missing.',
            ]);
        }

        try {
            $response = $this->api->createSignal($signalName, $signalDescription, $signalId);

            return $result->setData([
                'status' => !is_null($response)
            ]);

        } catch (\Throwable $e) {
            return $result->setData([
                'status' => false,
                'msg' => $e->getMessage(),
            ]);
        }
    }
}

