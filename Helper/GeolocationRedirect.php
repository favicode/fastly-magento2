<?php

namespace Fastly\Cdn\Helper;

use Magento\Store\Api\Data\StoreInterface;

class GeolocationRedirect
{
    /**
     * Creates a new target URL based on the old URL.
     */
    public function getNewTargetUrl(string $targetUrl, StoreInterface $targetStore, StoreInterface $currentStore): string
    {
        $path = parse_url($targetUrl, PHP_URL_PATH);

        $currentBaseUrl = $currentStore->getBaseUrl();
        $targetBaseUrl = $targetStore->getBaseUrl();

        $currentStoreCode = $currentStore->getCode();
        $targetStoreCode = $targetStore->getCode();

        $targetUrl = \str_ireplace($currentBaseUrl, $targetBaseUrl, $targetUrl);

        if (\preg_match("#^/$currentStoreCode(?:/|\?|$)#", $path)) {
            $targetUrl = \preg_replace(
                "#/$currentStoreCode#",
                "/$targetStoreCode",
                $targetUrl,
                1
            );
        }

        return $targetUrl;
    }
}
