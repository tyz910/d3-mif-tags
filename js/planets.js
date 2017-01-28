var ImgPreloader = (function () {
    function ImgPreloader() {
        this.preloadedBooks = new Image();
    }

    ImgPreloader.prototype.preload = function (src) {
        var img = new Image();
        img.src = src;
    };

    ImgPreloader.prototype.preloadBooks = function (bookIds, books) {
        var self = this;
        bookIds.forEach(function (bookId) {
            if (!self.preloadedBooks.hasOwnProperty(bookId)) {
                self.preloadedBooks[bookId] = true;
                self.preload(books[bookId].cover.small);
            }
        });
    };

    return ImgPreloader;
})();

var Planets = (function () {
    function Planets(star) {
        this.star = star;
        this.opts = star.uni.opts;

        this.force = d3.layout.force();
        this.nodes = [];
        this.links = [];
        this.layout = {};

        if (star.d.books && star.d.books.length) {
            this.preloader.preloadBooks(star.d.books, star.uni.books);
            this._linkNodes();
        }
    }

    Planets.prototype.preloader = new ImgPreloader();

    Planets.prototype._linkNodes = function () {
        var links = this.links;
        var linkDistance = 0;
        var linkDistanceDiff = 0;
        var linkDistances = this.opts.starPlanetDistances;

        var nodeSize = 0;
        var nodeSizes = this.opts.starPlanetSizes;

        this.nodes = this.star.d.books.slice(0, this.opts.starMaxPlanets).map(function (bookId, i) {
            if (typeof nodeSizes[i] !== 'undefined') {
                nodeSize = nodeSizes[i];
            }

            if (typeof linkDistances[i] !== 'undefined') {
                linkDistanceDiff = linkDistances[i];
            }

            linkDistance += linkDistanceDiff;

            var d = {
                'id': bookId,
                'size': nodeSize,
                'distance': linkDistance
            };

            if (i > 0) {
                links.push({
                    'source': i,
                    'target': 0,
                    'distance': linkDistance
                });
            } else {
                d.fixed = true;
            }

            return d;
        });
    };

    Planets.prototype._buildForce = function () {
        var self = this;
        return this.force.size([0, 0])
            .nodes(this.nodes)
            .links(this.links)
            .gravity(this.opts.starGravity)
            .friction(this.opts.starFriction)
            .charge(this.opts.starCharge)
            .chargeDistance(this.opts.starChargeDistance)
            .linkDistance(function (d) {
                return d.distance;
            })
            .on('tick', function (e) {
                self.tick(e);
            })
        ;
    };

    Planets.prototype._buildLayout = function () {
        var self = this;

        var space = this.layout.space = this.star.uni.layout.map
            .append('g')
            .attr('class', 'books')
            .attr('transform', Layout.transformTranslate(this.star.d.x, this.star.d.y))
        ;

        this.layout.node = space.selectAll('.book')
            .data(this.nodes).enter()
            .append('g')
                .attr('class', 'book')
            .append("image")
                .attr("xlink:href", function (d) {
                    return self.star.uni.books[d.id].cover.small;
                })
                .attr("width", function (d) {
                    return d.size;
                })
                .attr("height", function (d) {
                    return d.size;
                })
                .attr("x", function (d) {
                    return - d.size / 2;
                })
                .attr("y", function (d) {
                    return - d.size / 2;
                })
            .on('click', function (d) {
                self.nodeClick(d);
            })
        ;
    };

    Planets.prototype.tick = function (e) {
        this.nodes.forEach(function (d, i) {
            if (i > 0) {
                var move = 5 * e.alpha;

                d.x += (d.y < 0) ? move : -move;
                d.y += (d.x < 0) ? -move : move;
            }
        });

        this.layout.node
            .attr('transform', function (d, i) {
                if (i > 0) {
                    return Layout.transformTranslate(d.x, d.y);
                } else {
                    return Layout.transformTranslate(0, 0);
                }
            })
        ;
    };

    Planets.prototype.nodeClick = function (d) {
        var self = this;

        var items = [];
        $.each(this.nodes, function (i, d) {
            var book = self.star.uni.books[d.id];

            var div = $('<div class="book-popup">').append(
                $('<a target="_blank">').attr('href', book.url).append(
                    $('<img>').attr('src', book.cover.large)
                )
            );

            items.push({
                type: 'inline',
                src: div
            });
        });

        $.magnificPopup.open({
            items: items,
            closeBtnInside: true,
            gallery: {
                enabled: true
            }
        }, d.index);

        var layout = this.star.uni.layout;
        if (layout.reqFS) {
            $(layout.wrapper.node())
                .append($('.mfp-bg').detach())
                .append($('.mfp-wrap').detach())
            ;
        }
    };

    Planets.prototype.isEmpty = function () {
        return this.nodes.length == 0;
    };

    Planets.prototype.show = function () {
        if (this.isEmpty()) {
            return;
        }

        this._buildLayout();
        var force = this._buildForce();

        force.start();
    };

    Planets.prototype.destroy = function () {
        this.force.stop();
        delete this.force;
        if (this.layout.space) {
            this.layout.space.remove();
        }
    };

    return Planets;
})();
