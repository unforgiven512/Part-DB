{locale path="nextgen/locale" domain="partdb"}
<div class="panel panel-primary">
    <div class="panel-heading">
        {t}Sonstiges{/t}
    </div>
    <div class="panel-body">
        <form action="" method="post" class="form-horizontal no-progbar">
            <input type="hidden" name="cid" value="{$cid}">
            <input type="hidden" name="subcat" value="{if $with_subcategories}0{else}1{/if}">
            
            <div class="form-group">
                <label class="control-label col-md-2">{t}Unterkategorien:{/t}</label>
                <div class="col-md-10">
                    <button type="submit" class="btn btn-default" name="subcat_button" >{if $with_subcategories}{t}ausblenden{/t}{else}{t}einblenden{/t}{/if}</button>
                </div>
            </div>
        </form>
        <a class="btn btn-primary" href="edit_part_info.php?category_id={$cid}">
            {t}Neues Teil in dieser Kategorie{/t}
        </a>
        
    </div>
</div>

{if $pagination > 0}
<nav aria-label="Page navigation" align="right">
    <ul class="pagination pagination-no-margin">
        <li {if $page <= 1}class="disabled"{/if}>
            <a {if $page > 1}href="show_category_parts.php?cid={$cid}&pagination={$pagination}&page={$page - 1}"{/if} aria-label="Previous">
                <i class="fa fa-angle-left" aria-hidden="true"></i>
            </a>
        </li>
        {if $page <= 1}
            <li class="active"><a href="#">{$page}</a></li>
            <li><a href="show_category_parts.php?cid={$cid}&pagination={$pagination}&page={$page + 1}">{$page + 1}</a></li>
            <li><a href="show_category_parts.php?cid={$cid}&pagination={$pagination}&page={$page + 2}">{$page + 2}</a></li>
            <li><a href="show_category_parts.php?cid={$cid}&pagination={$pagination}&page={$page + 3}">{$page + 3}</a></li>
        {else}
            <li><a href="show_category_parts.php?cid={$cid}&pagination={$pagination}&page={$page - 1}">{$page - 1}</a></li>
            <li class="active"><a href="show_category_parts.php?cid={$cid}&pagination={$pagination}&page={$page}">{$page}</a></li>
            <li><a href="show_category_parts.php?cid={$cid}&pagination={$pagination}&page={$page + 1}">{$page + 1}</a></li>
            <li><a href="show_category_parts.php?cid={$cid}&pagination={$pagination}&page={$page + 2}">{$page + 2}</a></li>
        {/if}
        <li>
            <a href="show_category_parts.php?cid={$cid}&pagination={$pagination}&page={$page + 1}" aria-label="Next">
                <i class="fa fa-angle-right" aria-hidden="true"></i>
            </a>
        </li>
    </ul>
</nav>
{/if}

<div class="panel panel-default">
    <div class="panel-heading">
        <i class="fa fa-tag" aria-hidden="true"></i>&nbsp;
        {t}Teile in der Kategorie{/t} <b>"{$category_name}"</b>
    </div>
    <form method="post" action="" class="no-progbar">
        <input type="hidden" name="cid" value="{$cid}">
        <input type="hidden" name="subcat" value="{if $with_subcategories}1{else}0{/if}">
        <input type="hidden" name="table_rowcount" value="{$table_rowcount}">
           {include file='../smarty_table.tpl'}
    </form>
</div>
