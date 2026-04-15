<?php

namespace Fastly\Cdn\Controller\Adminhtml\FastlyCdn\Ngwaf;

use Fastly\Cdn\Model\Api;
use Magento\Backend\App\Action;
use Magento\Backend\App\Action\Context;
use Magento\Framework\Controller\Result\JsonFactory;

class DeleteWorkspaceList extends Action
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

        $listId = $this->getRequest()->getParam('workspace_list_id');

        if (empty($listId)) {
            return $result->setData([
                'status' => false,
                'msg' => 'List ID is missing.',
            ]);
        }

        try {
            $response = $this->api->deleteWorkspaceList($listId);

            return $result->setData([
                'status' => is_null($response) // response body is null on successful delete workspace list request
            ]);

        } catch (\Throwable $e) {
            return $result->setData([
                'status' => false,
                'msg' => $e->getMessage(),
            ]);
        }
    }
}
