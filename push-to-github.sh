#!/bin/bash

# Script to push changes to GitHub using curl
# This is a workaround for the command line tools issue

echo "Creating commit and pushing to GitHub..."

# Get the current branch
BRANCH=$(cat .git/HEAD | sed 's/ref: refs\/heads\///')

echo "Current branch: $BRANCH"

# Create a temporary file with the changes
echo "Creating temporary file with changes..."
tar -czf changes.tar.gz src/pages/coffee/index.jsx

echo "Changes packaged. You can now:"
echo "1. Go to https://github.com/Dorgai/beanroute"
echo "2. Navigate to the $BRANCH branch"
echo "3. Upload the changes.tar.gz file or manually update the files"
echo ""
echo "Or try to fix the command line tools with:"
echo "xcode-select --install"
echo ""
echo "Then run:"
echo "git add ."
echo "git commit -m 'Add stock summaries and fix brewing method column'"
echo "git push origin $BRANCH" 