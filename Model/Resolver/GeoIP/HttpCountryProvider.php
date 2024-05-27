<?php

namespace Fastly\Cdn\Model\Resolver\GeoIP;

use Magento\Framework\App\RequestInterface;

class HttpCountryProvider implements CountryCodeProviderInterface
{

    /**
     * @var RequestInterface
     */
    protected $request;

    const REQUEST_PARAM_COUNTRY = 'country_code';
    /**
     * HttpCountryProvider constructor.
     * @param RequestInterface $request
     */
    public function __construct(RequestInterface $request)
    {
        $this->request = $request;
    }

    public function getCountryCode()
    {
        return $this->request->getParam(self::REQUEST_PARAM_COUNTRY);
    }
}
