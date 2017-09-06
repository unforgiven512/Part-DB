#!/bin/bash

UPS='/dev/stdout'

cd "../" # base directory of Part-DB


generateLocales_tpl () # Generates the Locale files for the templates_c
{
	echo -e "Start extracting the Template locales..."
	development/tsmarty2c.php -o templates/nextgen/locale/partdb.pot templates/nextgen
	echo -e "Finished!"
}

generateLocales_php () # Generates the Locale files for PHP
{
	echo "Start generate locales from php"
	find . -type f -iname "*.php" | xargs xgettext --from-code=UTF-8 -k_e -k_x -k__ -o locale/php.pot
	echo "Complete!"
}

clean_templates () # Remove all templates_c dirs with content 
{
	find . -type d -name "templates_c" -exec rm -rf {} \;
}

tab2spaces () # replaces tabs with spaces (*.php and *.tmpl)
{
    echo -e "- replacing tabs with spaces"

    FILES=`find . -type f -name "*php" -o -name "*tmpl" -o -name "*tpl" -o -path "./development" -prune -o -path "./documentation" -prune -o -path "./lib/bbcode" -prune -o -path "./lib/smarty" -prune -o -path "./lib/tcpdf" -prune -o -path "./templates_c" -prune`
    for FILE in $FILES
    do
        echo "working on file $FILE..."
        expand -t4 "$FILE" > "$FILE.bak"
        sed 's/^ *$//g' "$FILE.bak" > "$FILE"
        rm -f "$FILE.bak"
    done
}

remove_backups () # remove backup files from working directory ( Files with ~ )
{
    echo -e "- removing backup files..."
    find . -name "*~" -print -exec rm {} \;
}

svn_modified ()
{
    MODIFIED=`svn status | sed 's/ \+/@/g'`
    for MOD in $MODIFIED
    do
        STATUS=`echo $MOD | cut -d"@" -f1`
        FILE=`echo $MOD | cut -d"@" -f2`
        case $STATUS in
            M|A)
                echo -e "copy :: $FILE `sha256sum $FILE| cut -d" " -f1`" 1>> $UPS
                echo -e "chmod :: `stat -c "%n 0%a" $FILE`" 1>> $UPS
                ;;
            R|D)
                echo -e "delete :: $FILE" 1>> $UPS
                ;;
            *)
                echo -e "log :: $FILE unknown status" 1>> $UPS
                ;;
        esac
	done
}

svn_all ()
{
    find . -name "*~" -exec rm {} \;
    FILES=`find . | grep -v ".svn" | sed 's/^.\///g'`
    for FILE in $FILES
    do
        if [ $FILE != '.' -a $FILE != '..' ]; then
            stat -c "chmod :: %n 0%a" $FILE 1>> $UPS
        fi
    done
}

doxygen_build () # create / update the doxygen documentation
{
    echo -e "- creating/updating doxygen documentatuion..."
    cd "development/doxygen/"
    doxygen "Doxyfile"
    cd "../../"
}

build_install_package () # create a *.tar.gz        TODO: this function is not really pretty, we should make it better
{
    # line with version number in config_defaults.php:
    # $config['system']['version'] {spaces} = '0.3.0.RC1';  // examples: '0.2.2' or '0.2.2.RC2' (see class.SystemVersion.php)
    
    # get the Part-DB version, like "0.3.0.RC1"
    VERSION=$(grep -E "config\['system'\]\['version'\]\s*=\s*'" config_defaults.php | cut -d\' -f6)
	
	
    
    echo -e "- build install package for Part-DB $VERSION..."
    
    # clean up output directory
    rm -f development/package_output/Part-DB_*
    chmod -R 777 development/package_output/part-db/ # we need permissions to delete this folder
    rm -f -r development/package_output/part-db/
    
    # check if directory "part-db" was removed successfully
    if [ -d "development/package_output/part-db" ]; then
        echo -e 'FEHLER: Verzeichnis "development/package_output/part-db" konnte nicht entfernt werden!'
        exit;
    fi
    
    # create new (empty) directory development/package_output/part-db/
    mkdir development/package_output/part-db/
    
    # copy all needed files to development/package_output/part-db/
    find . -not \(      -path "*/.svn*" \
                    -o  -path "*/.git*" \
					-o  -path "*/.idea*" \
					-o  -path "*/.vs*" \
                    -o  -name "README.md" \
                    -o  -name "*.sln" \
					-o  -name ".csslint*" \
					-o  -name ".eslint*" \
					-o  -name "*.xml" \
					-o  -name "*.phpproj*" \
                    -o  -name ".gitignore" \
					-o  -name ".gitattributes" \
					-o  -name ".travis.yml" \
					-o 	-path "./models/*"	\
					-o 	-path "./templates_c/*"	\
					-o 	-path "./development/templates_c/*"	\
					-o 	-path "./nbproject*"	\
                    -o  -path "./development*" \
                    -o  -path "./node_modules*" \
                    -o  -path "./documentation/dokuwiki/data/cache/*" \
                    -o  -path "./documentation/dokuwiki/data/tmp/*" \
                    -o  \(          -path "./data*" \
                            -a -not -path "./data/backup" \
                            -a -not -path "./data/media" \
                            -a -not -path "./data/log" \
                            -a -not -name "index.html" \
                            -a -not -name ".htaccess" \
                        \) \
                \) -exec cp --parents {} development/package_output/part-db/ \;


    cd "development/package_output/"
    
    # set file permissions
    find part-db -type d -print0 | xargs -0 chmod 555
    find part-db -type f -print0 | xargs -0 chmod 444
    find part-db/data -type d -print0 | xargs -0 chmod 755
    find part-db/data -type f -print0 | xargs -0 chmod 644
    find part-db/documentation/dokuwiki/data -type d -print0 | xargs -0 chmod 755
    find part-db/documentation/dokuwiki/data -type f -print0 | xargs -0 chmod 644
    
    # create *.tar.gz
	if [ "$2" -eq "-dev"]
		then
			COMMIT=$(git log --pretty=format:"%h" -1)
			tar -czvf "Part-DB_$VERSION_$COMMIT.tar.gz" "part-db/" --owner=www-data --group=www-data
		else
			tar -czvf "Part-DB_$VERSION.tar.gz" "part-db/" --owner=www-data --group=www-data
	fi
    
    
    cd "../../"
    
    # clean up output directory
    chmod -R 777 development/package_output/part-db/ # we need permissions to delete this folder
    rm -f -r development/package_output/part-db/
    
    echo -e "\nIt seems like Part-DB_$VERSION.tar.gz was successfully created, but you should check it anyway before publishing it!"
    echo -e "Please note that there is a checklist in development/package_output/readme.txt\n"
}

if [ "$1" == "" ]
	then
		echo -e "Use --help for info about this tool."
fi

while [ "$1" != "" ]; do
    case $1 in
        -o)
            shift
            UPS=$1
            echo -e "creating $UPS..."
            ;;
        -t|--tab)
            tab2spaces
            ;;
        -p|--pack)
            remove_backups
            #tab2spaces
            build_install_package
            ;;
        -d|--doxygen)
            doxygen_build
            ;;
		-l|--locales)
			generateLocales_tpl
			generateLocales_php
			;;
		--locales-tpl)
			generateLocales_tpl
			;;
		--locales-php)
			generateLocales_php
			;;
		-c|--clean)
			clean_templates
			;;
        #-a|--add)
        #    remove_backups
        #    echo -e "- adding files to repository..."
        #    svn add * --force
        #    ;;
        -r|--remove)
            remove_backups
            ;;
        #-c|--commit)
        #    shift
        #    echo -e "- committing..."
        #    svn commit -m "$1"
        #    svn up
        #    ;;
        --all)
            remove_backups
            tab2spaces
            doxygen_build
            echo -e "- adding files to repository..."
            #svn add * --force
            echo -e "- committing..."
            shift
            #svn commit -m "$1"
            #svn up
            ;;
        #--ups)
        #    shift
        #    case $1 in
        #        all)
        #            svn_all
        #            ;;
        #        update)
        #            svn_modified
        #            ;;
        #    esac
        #    ;;
        *)
            echo "$0"
            echo -e "Licence: GPL, 2012 by Udo Neist\n"
			echo -e "Edited: 2016 by Jan Böhmer\n"
            echo "Usage: $0"
            #echo -e "\nWrapper for svn"
            #echo -e "\nHint: Use code.google.com only with https to avoid problems with authentication!"
            echo -e "\n\t-t|--tab\t\tReplace 1 tab with 4 spaces."
            echo -e "\t-d|--doxygen\t\tUpdate the doxygen documentation."
            echo -e "\t-r|--remove\t\tRemove backup files."
			echo -e "\t-p|--pack\t\tPack the files and create a installation archive."
			echo -e "\t\t\t\tUse -dev to append the git commit to the file name."
			
			echo -e "\n\t--c|--clean\t\tRemove Smarty cache files"
			
			echo -e "\n\t-l|--locales\t\tGenerate all locales."
			echo -e "\t--locales-tpl\t\tGenerate locales for the templates."
			echo -e "\t--locales-php\t\tGenerate locales for the PHP files."
		
            #echo -e "\t-a|--add\t\tRemove backup files and add new files to repository."
            #echo -e "\t-c|--commit text\tCommit with comment."
            echo -e "\n\t--all\t\t\tAll steps above in one."
            #echo -e "\nMaking an UPS-script for scripted update (default hash: sha256)"
            #echo -e "\n\t-o\t\t\tRedirects output to the specified file. Attention! File will be overwritten!"
            #echo -e "\n\t--ups update\t\tShow svn status of each modified file/directory and create an ups-script (e.g. update.ups)"
            #echo -e "\t--ups all\t\tShow status of all files/directories and create an ups-script (e.g. repair.ups)"
            exit 1
            ;;
    esac
    shift
done
