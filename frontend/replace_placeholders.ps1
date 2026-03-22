$searchString = "'https://placehold.co/400x300?text=No+Image'"
$replaceString = "'data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%22400%22%20height%3D%22300%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Crect%20width%3D%22400%22%20height%3D%22300%22%20fill%3D%22%23eeeeee%22%2F%3E%3Ctext%20x%3D%2250%25%22%20y%3D%2250%25%22%20dominant-baseline%3D%22middle%22%20text-anchor%3D%22middle%22%20fill%3D%22%23999999%22%20font-family%3D%22sans-serif%22%20font-size%3D%2224%22%3ENo%20Image%3C%2Ftext%3E%3C%2Fsvg%3E'"

Get-ChildItem -Path "c:\Users\sanda\Desktop\bhathanivas.com\frontend\src" -Recurse -Include *.js,*.jsx | ForEach-Object {
    $content = Get-Content $_ -Raw
    if ($content -match \[regex]::Escape($searchString)) {
        $newContent = $content -replace \[regex]::Escape($searchString), $replaceString
        Set-Content $_ -Value $newContent -NoNewline
        Write-Host "Updated: $($_.FullName)"
    }
}
