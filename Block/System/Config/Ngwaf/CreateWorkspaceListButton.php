<?php

namespace Fastly\Cdn\Block\System\Config\Ngwaf;

use Magento\Config\Block\System\Config\Form\Field;
use Magento\Framework\Data\Form\Element\AbstractElement;

class CreateWorkspaceListButton extends Field
{
    protected function _construct()
    {
        $this->_template = 'Fastly_Cdn::system/config/ngwaf/create_button.phtml';

        parent::_construct();
    }

    /**
     * Remove scope label
     *
     * @param  AbstractElement $element
     * @return string
     */
    public function render(AbstractElement $element)
    {
        $element->unsScope()->unsCanUseWebsiteValue()->unsCanUseDefaultValue();
        return parent::render($element);
    }

    protected function _getElementHtml(AbstractElement $element)
    {
        return $this->_toHtml();
    }

    /**
     * @return string
     * @throws \Magento\Framework\Exception\LocalizedException
     */
    public function getButtonHtml()
    {
        $button = $this->getLayout()->createBlock(
            'Magento\Backend\Block\Widget\Button'
        )->setData([
            'id'    => 'fastly_ngwaf_workspace_list_create_button',
            'label' => __('Create Workspace List')
        ]);

        return $button->toHtml();
    }
}
