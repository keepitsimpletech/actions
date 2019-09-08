# setup-macports

> Based off the GitHub [setup-node](https://github.com/actions/setup-node) action

[MacPorts](https://www.macports.org) is an easy to use system for compiling, installing, and managing open source software. This action downloads and installs MacPorts, and updates the env `PATH`.

## Usage

See [action.yml](action.yml)

Basic:
```yaml
steps:
- name: MacPorts
  uses: keepitsimpletech/actions/setup-macports@releases/v1
- name: Install first Macport double-conversion using Cmake
  run: |
    port version
    ls -l $(which cmake)
    cmake --version
    sudo port -vs install double-conversion
- name: Upload artifacts
  uses: actions/upload-artifact@master
  with: 
    name: double-conversion
    path: /opt/local/var/macports/software/double-conversion
```

## License

The scripts and documentation in this project are released under the [MIT License](LICENSE)
