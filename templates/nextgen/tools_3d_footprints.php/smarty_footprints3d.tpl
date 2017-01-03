<div class="panel panel-primary">
    <div class="panel-heading">{t}3D Footprints{/t}</div>
    <div class="panel-body">
        <div class="col-md-4">
            <div id="categories">
                <!-- <h4>{t}Kategorien{/t}</h4>-->
                <div class="dropdown">
                    <button class="btn-text dropdown-toggle" type="button" id="dropdownModels" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">
                        <h4 class="sidebar-title">{t}3D-Modelle{/t}
                            <span class="caret"></span></h4>
                    </button>
                    <ul class="dropdown-menu" aria-labelledby="dropdownModels">
                        <li><a href="#" class="tree-btns no-action" data-mode="expand" data-target="tree-models">{t}Alle ausklappen{/t}</a></li>
                        <li><a href="#" class="tree-btns no-action" data-mode="collapse" data-target="tree-models">{t}Alle einklappen{/t}</a></li>
                    </ul>
                </div>
                <div class="modelselect-tree" id="tree-models"></div>
            </div>
        </div>

        <div class="col-md-8">

            <div class="input-group">
                <input type="search" class="form-control" id="modelselect-search" placeholder="{t}Suchen{/t}">
                <span class="input-group-btn">
                    <button class="btn btn-default" type="button" id="modelselect-search-clear">{t}Reset{/t}</button>
                    <button class="btn btn-default" type="button" id="modelselect-search-btn">{t}Suche{/t}</button>
                </span>
            </div>

            <h4 id="model-path">{t}Bitte Modell auswählen!{/t}</h4>

            <x3d class="img-thumbnail"   id="x3d-footprints" showStat="false"
                 showLog="false" >
                <scene>
                    <directionalLight id="directional" direction='1 1 1' on ="false" intensity='0.7' > </directionalLight>
                    <directionalLight id="directional" direction='-1 -1 -1' on ="false" intensity='0.7'> </directionalLight>
                    <inline id="inlineBox" url=""> </inline>
                    <navigationInfo id="head" headlight='true' speed="5.0" type='"EXAMINE"'>  </navigationInfo>
                    <!-- /part-db/models/Buttons_Switches_ThroughHoleSW_DIP_x12_Slide.x3d -->
                </scene>
                <button class="btn btn-sm btn-outline-secondary" data-toggle="modal" data-target="#fullscreen"><i class="fa fa-arrows-alt" aria-hidden="true"></i></button>
            </x3d>

            <p></p>

            <div class="form-horizontal">
                <div class="form-group">
                    <label class="col-md-3 control-label">{t}Licht:{/t}</label>
                    <div class="col-md-9">
                        <div class="checkbox checkbox-inline">
                            <input type="checkbox" id="activate_headlight" checked>
                            <label>{t}Headlight aktiv{/t}</label>
                        </div>

                        <div class="checkbox checkbox-inline">
                            <input type="checkbox" id="activate_dirlight">
                            <label>{t}Directional light aktiv{/t}</label>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label class="col-md-3 control-label">{t}Geschwindigkeit:{/t}</label>
                    <div class="col-md-9">
                        <input id="speed-slider" class="form-control" type="range" min="1.0" max="20" step="0.5" value="5.0" />
                    </div>
                </div>
                <div class="form-group">
                    <label class="col-md-3 control-label">{t}Hintergrundfarbe:{/t}</label>
                    <div class="col-md-9">
                        <input class="form-control" id="bg-color" type="color" value="#ffffff">
                    </div>
                </div>
            </div>

        </div>

    </div>
</div>


<!-- 3D Footprint Fullscreen Modal -->
<div class="modal fade" id="fullscreen" tabindex="-1" role="dialog" aria-labelledby="myModalLabel">
    <div class="modal-dialog modal-lg" role="document">
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                <h4 class="modal-title" id="myModalLabel">{t}3D-Footprint{/t}</h4>
            </div>
            <div class="modal-body">
                <div class="container-fluid">
                    <x3d id="foot3d" class="img-thumbnail x3d-fullscreen" >
                        <scene>
                            <transform>
                                <inline id="inlineBox2" url=""> </inline>
                            </transform>
                        </scene>
                    </x3d>
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-default" data-dismiss="modal">{t}Schließen{/t}</button>
            </div>
        </div>
    </div>
</div>