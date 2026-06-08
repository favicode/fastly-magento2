<?php

namespace Fastly\Cdn\Block\System\Config\Ngwaf;

use Fastly\Cdn\Model\Api;
use Magento\Framework\View\Helper\SecureHtmlRenderer;

class NgwafFieldset extends \Magento\Config\Block\System\Config\Form\Fieldset
{

    private ?bool $isBotManagementEnabled = null;

    public function __construct(
        private Api $api,
        \Magento\Backend\Block\Context $context,
        \Magento\Backend\Model\Auth\Session $authSession,
        \Magento\Framework\View\Helper\Js $jsHelper,
        array $data = [],
        ?SecureHtmlRenderer $secureRenderer = null
    ) {
        parent::__construct($context, $authSession, $jsHelper, $data);
    }

    protected function _getHeaderHtml($element)
    {

        // If bot Management is not enabled, don't display fieldset
        if (!$this->getIsBotManagementEnable()) {
            return '';
        }

        return parent::_getHeaderHtml($element);
    }

    public function render(
        \Magento\Framework\Data\Form\Element\AbstractElement $element
    ) {

        // If bot Management is not enabled, don't display fieldset
        if (!$this->getIsBotManagementEnable()) {
            return '';
        }

        return parent::render($element);
    }

    private function getIsBotManagementEnable()
    {
        if (!isset($this->isBotManagementEnabled)) {

            try {

                $response = $this->api->getBotManagementStatus();

                $this->isBotManagementEnabled = is_object($response);
            } catch (\Throwable $e) {
                $this->isBotManagementEnabled = false;
            }
        }

        return $this->isBotManagementEnabled;
    }
}
