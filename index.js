#!/usr/bin/env node

const { promisify } = require('util')
const exec = promisify(require('child_process').exec)
const prompts = require('prompts')

const DISPLAY_LIST_COMMAND="git for-each-ref --color=always --sort=-committerdate refs/heads/ --format='%(HEAD) %(align:19)%(color:green)%(committerdate:relative)%(color:reset)%(end) %(color:red)%(objectname:short)%(color:reset)  %(color:yellow)%(refname:short)%(color:reset)  %(contents:subject) %(color:blue) %(authorname)%(color:reset)'";
const LIST_COMMAND="git for-each-ref --sort=-committerdate refs/heads/ --format='%(refname:short)'";

async function run () {
  const { stdout: display_list_output } = await exec(DISPLAY_LIST_COMMAND)
  const { stdout: list_output } = await exec(LIST_COMMAND)

  const display_options = display_list_output.split(/\n/);
  const options = list_output.split(/\n/);

  if (options.length === 0) {
    process.exit(1);
  }
  if (options.length !== display_options.length) {
    process.stderr.write('Size mismatch between display list and option list\n');
    process.exit(1);
  }

  const choices = []
  for (let i = 0; i < display_options.length - 1; i++) {
    choices.push({title: display_options[i], value: options[i]});
  }

  const result = await prompts({
    type: 'autocomplete',
    name: 'branch',
    message: 'Select a branch',
    choices,
    limit: 20,
    suggest: (input, choices) => choices.filter(i=> i.title.toLowerCase().includes(input.toLowerCase())),
    onCancel: () => false
  })

  if (!result.branch) {
    process.exit(0);
  }

  await checkout(result.branch)
}

async function checkout (branch) {
  if (!branch) return
  const { stdout, stderr } = await exec(`git checkout ${branch}`)
  process.stdout.write(stdout)
  process.stderr.write(stderr)
}

function onError (e) {
  if (e.stderr) {
    process.stderr.write(e.stderr)
  } else {
    console.error(e)
  }
}

run().catch(onError)
