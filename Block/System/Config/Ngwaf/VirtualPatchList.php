<?php

namespace Fastly\Cdn\Block\System\Config\Ngwaf;

use Magento\Config\Block\System\Config\Form\Field\FieldArray\AbstractFieldArray;

class VirtualPatchList extends AbstractFieldArray
{

    protected function _construct() // @codingStandardsIgnoreLine - required by parent class
    {
        $this->addColumn('patch_id', ['label' => __('ID')]);
        $this->addColumn('patch_status', ['label' => __('Enabled')]);
        $this->addColumn('patch_mode', ['label' => __('Mode')]);
        $this->_addAfter = false;
        $this->_template = 'Fastly_Cdn::system/config/ngwaf/virtual_patches.phtml';

        parent::_construct();
    }
}
