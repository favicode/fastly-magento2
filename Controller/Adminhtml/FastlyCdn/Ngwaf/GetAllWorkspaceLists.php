<?php

namespace Fastly\Cdn\Controller\Adminhtml\FastlyCdn\Ngwaf;

use Fastly\Cdn\Model\Api;
use Magento\Backend\App\Action;
use Magento\Backend\App\Action\Context;
use Magento\Framework\Controller\Result\JsonFactory;


class GetAllWorkspaceLists extends Action
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

        try {
            $workspaceLists = $this->api->getWorkspaceLists();

            return $result->setData([
                'status' => true,
                'workspaceLists' => $workspaceLists
            ]);

        } catch (\Throwable $e) {
            return $result->setData([
                'status' => false,
                'msg' => $e->getMessage(),
            ]);
        }
    }
}
