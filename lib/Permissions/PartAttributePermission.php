<?php
/**
 * Created by PhpStorm.
 * User: janhb
 * Date: 18.09.2017
 * Time: 21:45
 */

namespace PartDB\Permissions;


class PartAttributePermission extends BasePermission
{
    const READ  = "read";
    const EDIT  = "edit";

    /**
     * Returns an array of all available operations for this Permission.
     * @return array All availabel operations.
     */
    public static function listOperations()
    {
        /**
         * Dont change these definitions, because it would break compatibility with older database.
         * However you can add other definitions, the return value can get high as 30, as the DB uses a 32bit integer.
         */
        $operations = array();
        $operations[] = static::buildOperationArray(0, static::READ, _("Anzeigen"));
        $operations[] = static::buildOperationArray(2, static::EDIT, _("Bearbeiten"));
        return $operations;
    }

    protected function modifyValueBeforeSetting($operation, $new_value, $data)
    {
        //Set read permission, too, when you get edit permissions.
        if ($operation == static::EDIT && $new_value == static::ALLOW) {
            return parent::writeBitPair($data, static::opToBitN(static::READ), static::ALLOW);
        }

        return $data;
    }

}