cd ~/Documents/Github


for r in ~/Documents/Github/*; do
  cd $r
  # find ./src/**/* --type file | xargs wc -l | grep 'total'
  find ./src -type f -exec wc -l {} + | tail -n1


done